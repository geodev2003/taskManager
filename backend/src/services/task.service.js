const { pool, sql } = require("../config/db");
const AppError = require("../utils/appError");

/**
 * ============================
 * CREATE TASK (IDEMPOTENCY)
 * ============================
 */
async function createTask(uId, taskData, idempotencyKey) {
  if (!idempotencyKey) {
    throw new AppError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "Idempotency-Key header is required",
      400
    );
  }

  const { tName, tContent, tRimderAt, tDateExpire } = taskData;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Check idempotency
    const existed = await transaction
      .request()
      .input("uId", sql.Int, uId)
      .input("key", sql.VarChar(100), idempotencyKey).query(`
        SELECT ikResponse
        FROM idempotency_keys
        WHERE uId = @uId
          AND ikKey = @key
          AND iKCreated_at > DATEADD(HOUR, -24, GETDATE())
      `);

    if (existed.recordset.length > 0) {
      await transaction.rollback();
      return JSON.parse(existed.recordset[0].ikResponse);
    }

    // 2. Create task
    const taskResult = await transaction
      .request()
      .input("uId", sql.Int, uId)
      .input("tName", sql.NVarChar(50), tName).query(`
        INSERT INTO task (uId, tName, tStatus, tVersion)
        OUTPUT INSERTED.tId
        VALUES (@uId, @tName, 'todo', 1)
      `);

    const tId = taskResult.recordset[0].tId;

    // 3. Parse datetime từ frontend (datetime-local format: "YYYY-MM-DDTHH:mm")
    const parseDateTime = (value) => {
      if (!value || value === '' || value === null || value === undefined) return null;
      if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return value;
      }
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        return null;
      }
    };

    const parsedRimderAt = parseDateTime(tRimderAt);
    const parsedDateExpire = parseDateTime(tDateExpire);

    // 4. Create task details
    await transaction
      .request()
      .input("tId", sql.Int, tId)
      .input("tdContent", sql.NVarChar(200), tContent || '')
      .input("tdRimderAt", sql.DateTime, parsedRimderAt)
      .input("tdDateExpire", sql.DateTime, parsedDateExpire).query(`
        INSERT INTO taskDetails (tId, tdContent, tdRimderAt, tdDateExpire)
        VALUES (@tId, @tdContent, @tdRimderAt, @tdDateExpire)
      `);

    const response = {
      tId,
      tName,
      tStatus: "todo",
      tVersion: 1,
      tContent,
      tRimderAt: parsedRimderAt ? parsedRimderAt.toISOString() : null,
      tDateExpire: parsedDateExpire ? parsedDateExpire.toISOString() : null,
    };

    // 4. Audit log
    await transaction
      .request()
      .input("uId", sql.Int, uId)
      .input("tId", sql.Int, tId)
      .input("action", sql.NVarChar(50), "CREATE")
      .input("after", sql.NVarChar(sql.MAX), JSON.stringify(response)).query(`
          INSERT INTO taskAudits (uId, tId, taAction, taBeforeData, taAfterData)
          VALUES (@uId, @tId, @action, NULL, @after)
        `);

    // 5. Save idempotency key
    await transaction
      .request()
      .input("uId", sql.Int, uId)
      .input("key", sql.VarChar(100), idempotencyKey)
      .input("response", sql.NVarChar(sql.MAX), JSON.stringify(response))
      .query(`
        INSERT INTO idempotency_keys (uId, ikKey, ikResponse)
        VALUES (@uId, @key, @response)
      `);

    await transaction.commit();
    return response;
  } catch (err) {
    await transaction.rollback();
    throw new AppError("FAILED_TO_CREATE_TASK", "Failed to create task", 500);
  }
}

/**
 * ============================
 * UPDATE TASK (OPTIMISTIC LOCK)
 * ============================
 */
/**
 * UPDATE TASK
 * - User: chỉ update task của chính mình
 * - Admin: update được task của user khác
 * - Optimistic concurrency (version)
 * - Ghi audit before / after
 */
const updateTask = async (user, tId, payload) => {
  const { tName, tStatus, tContent, tRimderAt, tDateExpire, version } = payload;

  if (version === undefined) {
    throw new AppError(
      "VERSION_REQUIRED",
      "Task version is required",
      400
    );
  }

  const isAdmin = user.uRole === "admin";
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    /* 1️⃣ Lấy task hiện tại và taskDetails */
    const taskResult = await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          SELECT t.tId, t.uId, t.tName, t.tStatus, t.tVersion,
                 td.tdContent, td.tdRimderAt, td.tdDateExpire
          FROM task t
          LEFT JOIN taskDetails td ON td.tId = t.tId
          WHERE t.tId = @tId
            AND t.tDeleteAt IS NULL
        `);

    const task = taskResult.recordset[0];
    if (!task) {
      throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
    }

    /* 2️⃣ Check quyền */
    if (!isAdmin && task.uId !== user.uId) {
      throw new AppError(
        "FORBIDDEN",
        "You are not allowed to update this task",
        403
      );
    }

    /* 3️⃣ Optimistic concurrency */
    if (task.tVersion !== version) {
      throw new AppError(
        "TASK_VERSION_CONFLICT",
        "Task data has changed, please reload",
        409
      );
    }

    /* 4️⃣ Xác định các giá trị mới */
    const nextName = tName !== undefined ? tName : task.tName;
    const nextStatus = tStatus !== undefined ? tStatus : task.tStatus;
    const nextContent = tContent !== undefined ? tContent : (task.tdContent || '');

    // Convert ISO string to Date object hoặc null
    const parseDateTime = (value) => {
      if (!value || value === '' || value === null || value === undefined) return null;
      if (value instanceof Date) return value;
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        return null;
      }
    };

    const nextRimderAt = tRimderAt !== undefined ? parseDateTime(tRimderAt) : (task.tdRimderAt || null);
    const nextDateExpire = tDateExpire !== undefined ? parseDateTime(tDateExpire) : (task.tdDateExpire || null);

    /* 5️⃣ Kiểm tra có thay đổi không */
    const hasNameChange = nextName !== task.tName;
    const hasStatusChange = nextStatus !== task.tStatus;
    const hasContentChange = nextContent !== (task.tdContent || '');

    // So sánh datetime - convert về timestamp để so sánh
    const compareDateTime = (date1, date2) => {
      // Cả 2 đều null/undefined/empty
      if ((!date1 || date1 === null) && (!date2 || date2 === null)) return true;
      // Một trong 2 là null
      if ((!date1 || date1 === null) || (!date2 || date2 === null)) return false;

      try {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);

        // Kiểm tra invalid date
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
          // Nếu cả 2 đều invalid thì coi như bằng nhau
          if (isNaN(d1.getTime()) && isNaN(d2.getTime())) return true;
          return false;
        }

        return d1.getTime() === d2.getTime();
      } catch (e) {
        // Nếu parse fail, so sánh string
        return String(date1) === String(date2);
      }
    };

    const hasRimderAtChange = !compareDateTime(nextRimderAt, task.tdRimderAt);
    const hasDateExpireChange = !compareDateTime(nextDateExpire, task.tdDateExpire);

    if (!hasNameChange && !hasStatusChange && !hasContentChange && !hasRimderAtChange && !hasDateExpireChange) {
      throw new AppError(
        "NO_CHANGES",
        "No changes detected",
        400
      );
    }

    /* 6️⃣ Update task table (chỉ update nếu có thay đổi) */
    if (hasNameChange || hasStatusChange) {
      await transaction
        .request()
        .input("tId", sql.Int, tId)
        .input("tName", sql.NVarChar(50), nextName)
        .input("tStatus", sql.VarChar(30), nextStatus)
        .input("version", sql.Int, version)
        .query(`
            UPDATE task
            SET tName = @tName,
                tStatus = @tStatus,
                tVersion = @version + 1
            WHERE tId = @tId
              AND tVersion = @version
          `);
    } else {
      // Chỉ tăng version nếu không có thay đổi tName/tStatus
      await transaction
        .request()
        .input("tId", sql.Int, tId)
        .input("version", sql.Int, version)
        .query(`
            UPDATE task
            SET tVersion = @version + 1
            WHERE tId = @tId
              AND tVersion = @version
          `);
    }

    /* 7️⃣ Update taskDetails (nếu có thay đổi) */
    if (hasContentChange || hasRimderAtChange || hasDateExpireChange) {
      // Kiểm tra taskDetails đã tồn tại chưa
      const detailsCheck = await transaction
        .request()
        .input("tId", sql.Int, tId)
        .query(`SELECT tId FROM taskDetails WHERE tId = @tId`);

      // Xử lý datetime - đảm bảo là Date object hoặc null
      const formatDateTimeForSQL = (date) => {
        if (!date || date === null || date === undefined) return null;
        if (date instanceof Date) {
          if (isNaN(date.getTime())) return null;
          return date;
        }
        try {
          const d = new Date(date);
          return isNaN(d.getTime()) ? null : d;
        } catch (e) {
          return null;
        }
      };

      const sqlRimderAt = formatDateTimeForSQL(nextRimderAt);
      const sqlDateExpire = formatDateTimeForSQL(nextDateExpire);

      if (detailsCheck.recordset.length > 0) {
        // Update existing
        const updateReq = transaction.request()
          .input("tId", sql.Int, tId)
          .input("tdContent", sql.NVarChar(200), nextContent || '')
          .input("tdRimderAt", sql.DateTime, sqlRimderAt)
          .input("tdDateExpire", sql.DateTime, sqlDateExpire);

        await updateReq.query(`
            UPDATE taskDetails
            SET tdContent = @tdContent,
                tdRimderAt = @tdRimderAt,
                tdDateExpire = @tdDateExpire
            WHERE tId = @tId
          `);
      } else {
        // Insert new
        const insertReq = transaction.request()
          .input("tId", sql.Int, tId)
          .input("tdContent", sql.NVarChar(200), nextContent || '')
          .input("tdRimderAt", sql.DateTime, sqlRimderAt)
          .input("tdDateExpire", sql.DateTime, sqlDateExpire);

        await insertReq.query(`
            INSERT INTO taskDetails (tId, tdContent, tdRimderAt, tdDateExpire)
            VALUES (@tId, @tdContent, @tdRimderAt, @tdDateExpire)
          `);
      }
    }

    /* 8️⃣ Audit log */
    // Format datetime cho audit log (convert Date object thành ISO string)
    const formatDateForAudit = (date) => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') return date;
      return null;
    };

    const beforeData = {
      tName: task.tName,
      tStatus: task.tStatus,
      tContent: task.tdContent || '',
      tRimderAt: formatDateForAudit(task.tdRimderAt),
      tDateExpire: formatDateForAudit(task.tdDateExpire),
      tVersion: task.tVersion
    };

    const afterData = {
      tName: nextName,
      tStatus: nextStatus,
      tContent: nextContent,
      tRimderAt: formatDateForAudit(nextRimderAt),
      tDateExpire: formatDateForAudit(nextDateExpire),
      tVersion: version + 1
    };

    await transaction
      .request()
      .input("uId", sql.Int, user.uId)
      .input("tId", sql.Int, tId)
      .input("action", sql.NVarChar(50), "UPDATE")
      .input("before", sql.NVarChar(sql.MAX), JSON.stringify(beforeData))
      .input("after", sql.NVarChar(sql.MAX), JSON.stringify(afterData))
      .query(`
          INSERT INTO taskAudits (
            uId,
            tId,
            taAction,
            taBeforeData,
            taAfterData
          )
          VALUES (
            @uId,
            @tId,
            @action,
            @before,
            @after
          )
        `);

    await transaction.commit();

    return {
      tId,
      ...afterData
    };
  } catch (err) {
    await transaction.rollback();

    // Log error chi tiết để debug
    console.error('❌ updateTask error:', {
      tId,
      error: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      payload: {
        tName,
        tStatus,
        tContent: tContent ? `${tContent.substring(0, 50)}...` : null,
        tRimderAt: tRimderAt ? String(tRimderAt).substring(0, 30) : null,
        tDateExpire: tDateExpire ? String(tDateExpire).substring(0, 30) : null,
        version
      }
    });

    // Nếu là AppError thì throw lại, không thì wrap thành AppError
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(
      "UPDATE_TASK_FAILED",
      `Failed to update task: ${err.message}`,
      500
    );
  }
};


/**
 * ============================
 * SOFT DELETE TASK
 * ============================
 */
const softDeleteTask = async (user, tId) => {
  const { uId, uRole } = user;
  const isAdmin = uRole === "admin";

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Lấy task hiện tại
    const taskResult = await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          SELECT *
          FROM task
          WHERE tId = @tId AND tDeleteAt IS NULL
        `);

    const task = taskResult.recordset[0];
    if (!task) {
      throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
    }

    // 2. Check ownership nếu không phải admin
    if (!isAdmin && task.uId !== uId) {
      throw new AppError(
        "FORBIDDEN",
        "You are not allowed to delete this task",
        403
      );
    }

    // 3. Soft delete
    await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          UPDATE task
          SET tDeleteAt = GETDATE()
          WHERE tId = @tId
        `);

    // 4. Audit log
    await transaction
      .request()
      .input("uId", sql.Int, uId)
      .input("tId", sql.Int, tId)
      .input("action", sql.VarChar, "SOFT_DELETE")
      .input("before", sql.NVarChar(sql.MAX), JSON.stringify(task))
      .query(`
          INSERT INTO taskAudits (uId, tId, taAction, taBeforeData)
          VALUES (@uId, @tId, @action, @before)
        `);

    await transaction.commit();
    return { message: "Task soft deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * ============================
 * HARD DELETE TASK
 * ============================
 */
const hardDeleteTask = async (user, tId) => {
  const { uId, uRole } = user;

  if (uRole !== "admin") {
    throw new AppError(
      "FORBIDDEN",
      "Only admin can permanently delete tasks",
      403
    );
  }

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Lấy task
    const taskResult = await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          SELECT *
          FROM task
          WHERE tId = @tId
        `);

    const task = taskResult.recordset[0];
    if (!task) {
      throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
    }

    // 2. Xóa các bảng liên quan trước (theo thứ tự foreign key)
    // Xóa taskDetails trước (có foreign key tới task)
    await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          DELETE FROM taskDetails
          WHERE tId = @tId
        `);

    // Xóa taskAudits (có foreign key tới task)
    // Lưu ý: Xóa tất cả audit logs trước khi xóa task
    await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          DELETE FROM taskAudits
          WHERE tId = @tId
        `);

    // 3. Xóa task (cuối cùng)
    // Note: Không thể insert audit log cho HARD_DELETE vì foreign key constraint
    // Task sẽ bị xóa hoàn toàn khỏi database
    await transaction
      .request()
      .input("tId", sql.Int, tId)
      .query(`
          DELETE FROM task
          WHERE tId = @tId
        `);

    await transaction.commit();
    return { message: "Task permanently deleted" };
  } catch (err) {
    await transaction.rollback();
    console.error(`❌ hardDeleteTask error for tId ${tId}:`, err.message);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    throw err;
  }
};

/**
 * ============================
 * RESTORE TASK
 * ============================
 */
async function restoreTask(user, tId) {
  const { uId, uRole } = user;
  const isAdmin = uRole === "admin";

  // Kiểm tra task tồn tại và đã bị soft delete
  const taskCheck = await pool
    .request()
    .input("tId", sql.Int, tId)
    .query(`
      SELECT uId, tDeleteAt
      FROM task
      WHERE tId = @tId
    `);

  if (taskCheck.recordset.length === 0) {
    throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
  }

  const task = taskCheck.recordset[0];

  // Kiểm tra quyền: chỉ owner hoặc admin mới được restore
  if (!isAdmin && task.uId !== uId) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to restore this task",
      403
    );
  }

  // Kiểm tra task đã bị soft delete chưa
  if (!task.tDeleteAt) {
    throw new AppError(
      "TASK_NOT_DELETED",
      "Task is not deleted",
      400
    );
  }

  // Restore task
  const result = await pool
    .request()
    .input("tId", sql.Int, tId)
    .query(`
      UPDATE task
      SET tDeleteAt = NULL
      WHERE tId = @tId
    `);

  if (result.rowsAffected[0] === 0) {
    throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
  }

  // Audit log
  await pool
    .request()
    .input("uId", sql.Int, uId)
    .input("tId", sql.Int, tId)
    .input("action", sql.NVarChar(50), "RESTORE")
    .input("after", sql.NVarChar(sql.MAX), JSON.stringify({ tDeleteAt: null }))
    .query(`
      INSERT INTO taskAudits (uId, tId, taAction, taBeforeData, taAfterData)
      VALUES (@uId, @tId, @action, NULL, @after)
    `);

  return { message: "Task restored successfully" };
}

/**
 * ============================
 * GET TASK LIST (SEARCH + PAGINATION)
 * ============================
 */
const getTasks = async (user, search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const isAdmin = user.uRole === "admin";

  let tasksQuery = "";
  let countQuery = "";

  if (isAdmin) {
    tasksQuery = `
        SELECT 
          t.tId,
          t.tName,
          t.tStatus,
          t.tVersion,
          t.tCreateAt,
          t.uId,
          u.uName,
          td.tdContent AS tContent,
          td.tdRimderAt AS tRimderAt,
          td.tdDateExpire AS tDateExpire
        FROM task t
        JOIN users u ON u.uId = t.uId
        LEFT JOIN taskDetails td ON td.tId = t.tId
        WHERE t.tDeleteAt IS NULL
          AND t.tName LIKE @search
        ORDER BY t.tId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

    countQuery = `
        SELECT COUNT(*) AS total
        FROM task t
        WHERE t.tDeleteAt IS NULL
          AND t.tName LIKE @search
      `;
  } else {
    tasksQuery = `
        SELECT 
          t.tId,
          t.tName,
          t.tStatus,
          t.tVersion,
          t.tCreateAt,
          td.tdContent AS tContent,
          td.tdRimderAt AS tRimderAt,
          td.tdDateExpire AS tDateExpire
        FROM task t
        LEFT JOIN taskDetails td ON td.tId = t.tId
        WHERE t.uId = @uId
          AND t.tDeleteAt IS NULL
          AND t.tName LIKE @search
        ORDER BY t.tId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

    countQuery = `
        SELECT COUNT(*) AS total
        FROM task
        WHERE uId = @uId
          AND tDeleteAt IS NULL
          AND tName LIKE @search
      `;
  }

  const request = pool
    .request()
    .input("search", sql.NVarChar(100), `%${search}%`)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  if (!isAdmin) request.input("uId", sql.Int, user.uId);

  const tasks = await request.query(tasksQuery);

  const countReq = pool
    .request()
    .input("search", sql.NVarChar(100), `%${search}%`);

  if (!isAdmin) countReq.input("uId", sql.Int, user.uId);

  const total = await countReq.query(countQuery);

  // Format dates trong tasks để đảm bảo format nhất quán
  const formattedTasks = tasks.recordset.map(task => ({
    ...task,
    tRimderAt: task.tRimderAt ? new Date(task.tRimderAt).toISOString() : null,
    tDateExpire: task.tDateExpire ? new Date(task.tDateExpire).toISOString() : null,
    tCreateAt: task.tCreateAt ? new Date(task.tCreateAt).toISOString() : null,
  }));

  return {
    tasks: formattedTasks,
    total: total.recordset[0].total,
    page,
    limit,
    hasMore: offset + tasks.recordset.length < total.recordset[0].total
  };
};


/**
 * ============================
 * GET TASK AUDITS
 * ============================
 * Chỉ chủ sở hữu task mới được xem audit
 */
async function getTaskAudits(uId, tId) {
  // 1. Kiểm tra task tồn tại và thuộc về user
  const taskResult = await pool
    .request()
    .input("tId", sql.Int, tId)
    .query(`
      SELECT uId
      FROM task
      WHERE tId = @tId AND tDeleteAt IS NULL
    `);

  if (taskResult.recordset.length === 0) {
    throw new AppError("TASK_NOT_FOUND", "Task not found", 404);
  }

  const taskOwnerId = taskResult.recordset[0].uId;
  if (taskOwnerId !== uId) {
    throw new AppError(
      "FORBIDDEN",
      "You can only view audits of your own tasks",
      403
    );
  }

  // 2. Lấy audit logs
  const result = await pool
    .request()
    .input("tId", sql.Int, tId)
    .query(`
      SELECT taAction, taBeforeData, taAfterData, taCreateAt
      FROM taskAudits
      WHERE tId = @tId
      ORDER BY taCreateAt DESC
    `);

  return result.recordset;
}

/**
 * ============================
 * GET SOFT DELETED TASKS (USER'S OWN TASKS)
 * ============================
 */
async function getMyDeletedTasks(uId, search = "", page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const tasksQuery = `
    SELECT 
      t.tId,
      t.tName,
      t.tStatus,
      t.tVersion,
      t.uId,
      t.tDeleteAt,
      td.tdContent AS tContent,
      td.tdRimderAt AS tRimderAt,
      td.tdDateExpire AS tDateExpire
    FROM task t
    LEFT JOIN taskDetails td ON td.tId = t.tId
    WHERE t.tDeleteAt IS NOT NULL
      AND t.uId = @uId
      AND t.tName LIKE @search
    ORDER BY t.tDeleteAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM task t
    WHERE t.tDeleteAt IS NOT NULL
      AND t.uId = @uId
      AND t.tName LIKE @search
  `;

  const request = pool
    .request()
    .input("uId", sql.Int, uId)
    .input("search", sql.NVarChar(100), `%${search}%`)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  const tasks = await request.query(tasksQuery);

  const countReq = pool
    .request()
    .input("uId", sql.Int, uId)
    .input("search", sql.NVarChar(100), `%${search}%`);

  const total = await countReq.query(countQuery);

  // Format dates
  const formattedTasks = tasks.recordset.map(task => ({
    ...task,
    tRimderAt: task.tRimderAt ? new Date(task.tRimderAt).toISOString() : null,
    tDateExpire: task.tDateExpire ? new Date(task.tDateExpire).toISOString() : null,
    tDeleteAt: task.tDeleteAt ? new Date(task.tDeleteAt).toISOString() : null,
  }));

  return {
    tasks: formattedTasks,
    total: total.recordset[0].total,
    page,
    limit,
    hasMore: offset + formattedTasks.length < total.recordset[0].total
  };
}

/**
 * ============================
 * GET SOFT DELETED TASKS (ADMIN ONLY)
 * ============================
 */
async function getSoftDeletedTasks(user, search = "", page = 1, limit = 10) {
  if (user.uRole !== "admin") {
    throw new AppError(
      "FORBIDDEN",
      "Only admin can view soft deleted tasks",
      403
    );
  }

  const offset = (page - 1) * limit;

  const tasksQuery = `
    SELECT 
      t.tId,
      t.tName,
      t.tStatus,
      t.tVersion,
      t.uId,
      t.tDeleteAt,
      u.uName,
      td.tdContent AS tContent,
      td.tdRimderAt AS tRimderAt,
      td.tdDateExpire AS tDateExpire
    FROM task t
    JOIN users u ON u.uId = t.uId
    LEFT JOIN taskDetails td ON td.tId = t.tId
    WHERE t.tDeleteAt IS NOT NULL
      AND t.tName LIKE @search
    ORDER BY t.tDeleteAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM task t
    WHERE t.tDeleteAt IS NOT NULL
      AND t.tName LIKE @search
  `;

  const request = pool
    .request()
    .input("search", sql.NVarChar(100), `%${search}%`)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  const tasks = await request.query(tasksQuery);

  const countReq = pool
    .request()
    .input("search", sql.NVarChar(100), `%${search}%`);

  const total = await countReq.query(countQuery);

  return {
    tasks: tasks.recordset,
    total: total.recordset[0].total,
    page,
    limit,
    hasMore: offset + tasks.recordset.length < total.recordset[0].total
  };
}

module.exports = {
  createTask,
  updateTask,
  softDeleteTask,
  hardDeleteTask,
  restoreTask,
  getTasks,
  getTaskAudits,
  getMyDeletedTasks,
  getSoftDeletedTasks,
};
