IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'taskAudits'
)
BEGIN
	CREATE TABLE taskAudits (
		taId INT PRIMARY KEY IDENTITY(1,1),
		uId INT NOT NULL,
		tId INT NOT NULL,
		taAction VARCHAR(50) NOT NULL,
		taBeforeData NVARCHAR(MAX) NULL,
		taAfterData NVARCHAR(MAX) NULL,
		taCreateAt DATETIME DEFAULT CURRENT_TIMESTAMP,

		CONSTRAINT fk_autdit_user
			FOREIGN KEY (uId) REFERENCES users(uId),

		CONSTRAINT fk_audit_task
			FOREIGN KEY (tId) REFERENCES task(tId)
	);
END;