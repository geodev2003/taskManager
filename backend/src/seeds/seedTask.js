const { sql, pool } = require('../config/db');

const taskNames = [
  'Fix login bug',
  'Design database schema',
  'Implement task API',
  'Write unit tests',
  'Refactor backend code',
  'Optimize SQL queries',
  'Prepare deployment',
  'Review pull request'
];

const auditActions = [
  'CREATE_TASK',
  'UPDATE_STATUS',
  'UPDATE_CONTENT'
];

const statuses = ['todo', 'doing', 'done'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function seedTasks() {
  console.log('Seeding Tasks...');

  try {
    // Lấy users
    const usersRes = await pool.request().query(`
      SELECT uId FROM users
    `);

    const users = usersRes.recordset;
    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    for (const user of users) {
      const taskCount = randomInt(2, 5);

      for (let i = 0; i < taskCount; i++) {
        const tName = randomItem(taskNames);
        const tStatus = randomItem(statuses);

        // Insert task
        const taskRes = await pool.request()
          .input('uId', sql.Int, user.uId)
          .input('tName', sql.VarChar, tName)
          .input('tStatus', sql.VarChar, tStatus)
          .query(`
            INSERT INTO task (uId, tName, tStatus)
            OUTPUT INSERTED.tId
            VALUES (@uId, @tName, @tStatus)
          `);

        const tId = taskRes.recordset[0].tId;

        console.log(`Task created: ${tName} (tId=${tId}, uId=${user.uId})`);

        //Insert taskDetails
        await pool.request()
          .input('tId', sql.Int, tId)
          .input(
            'tdContent',
            sql.VarChar,
            `Detail for task "${tName}"`
          )
          .query(`
            INSERT INTO taskDetails (tId, tdContent)
            VALUES (@tId, @tdContent)
          `);

        // Insert taskAudits (1–2 records)
        const auditCount = randomInt(1, 2);

        for (let j = 0; j < auditCount; j++) {
          const action = randomItem(auditActions);

          await pool.request()
            .input('uId', sql.Int, user.uId)
            .input('tId', sql.Int, tId)
            .input('taAction', sql.VarChar, action)
            .input(
              'taAfterData',
              sql.NVarChar,
              JSON.stringify({ tName, tStatus })
            )
            .query(`
              INSERT INTO taskAudits
              (uId, tId, taAction, taAfterData)
              VALUES
              (@uId, @tId, @taAction, @taAfterData)
            `);
        }
      }
    }

    console.log('Seed Tasks completed');
  } catch (err) {
    console.error('Error seeding tasks:', err);
  }
}

module.exports = seedTasks;
