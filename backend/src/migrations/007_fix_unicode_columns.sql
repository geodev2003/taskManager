-- Migration để fix Unicode cho tiếng Việt có dấu
-- Chuyển các column từ VARCHAR sang NVARCHAR

-- Fix users table
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'uName' AND system_type_id = 167) -- VARCHAR
BEGIN
    ALTER TABLE users ALTER COLUMN uName NVARCHAR(50);
END;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'uAddress' AND system_type_id = 167) -- VARCHAR
BEGIN
    ALTER TABLE users ALTER COLUMN uAddress NVARCHAR(100);
END;

-- Fix task table
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('task') AND name = 'tName' AND system_type_id = 167) -- VARCHAR
BEGIN
    ALTER TABLE task ALTER COLUMN tName NVARCHAR(50) NOT NULL;
END;

-- Fix taskDetails table
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('taskDetails') AND name = 'tdContent' AND system_type_id = 167) -- VARCHAR
BEGIN
    ALTER TABLE taskDetails ALTER COLUMN tdContent NVARCHAR(200) NOT NULL;
END;

-- Fix taskAudits table (taAction có thể giữ VARCHAR vì chỉ là action name, nhưng để đồng nhất thì đổi luôn)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('taskAudits') AND name = 'taAction' AND system_type_id = 167) -- VARCHAR
BEGIN
    ALTER TABLE taskAudits ALTER COLUMN taAction NVARCHAR(50) NOT NULL;
END;

