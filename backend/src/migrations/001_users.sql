IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'users'
)
BEGIN
    CREATE TABLE users (
        uId INT IDENTITY(1,1) PRIMARY KEY,
        uName VARCHAR(50),
        uGender INT DEFAULT 0,
        uPhone VARCHAR(20),
        uEmail VARCHAR(100) NOT NULL UNIQUE,
        uPassword VARCHAR(255) NOT NULL,
        uAddress VARCHAR(100),
        uRole VARCHAR(50) DEFAULT 'user',
        uCreateAt DATETIME DEFAULT GETDATE(),
        uDeleteAt DATETIME NULL
    );
END;
