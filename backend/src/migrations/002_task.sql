IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'task'
)
BEGIN
	CREATE TABLE task (
		tId INT PRIMARY KEY IDENTITY(1,1),
		uId INT NOT NULL,
		tName VARCHAR(50) NOT NULL,
		tVersion INT NOT NULL DEFAULT 1,
		tParent INT,
		tChild INT,
		tCreateAt DATETIME DEFAULT CURRENT_TIMESTAMP,
		tDeleteAt DATETIME NULL,
		tUpdateAt DATETIME NULL,
		tStatus VARCHAR(30) DEFAULT 'todo',
		tIsDeleted BIT DEFAULT 0,
		CONSTRAINT fk_task_user
			FOREIGN KEY (uId) REFERENCES users(uId)
	);
END;