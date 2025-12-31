IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'taskDetails'
)
BEGIN
	CREATE TABLE taskDetails (
		tdId INT PRIMARY KEY IDENTITY(1,1),
		tId INT NOT NULL,
		tdContent VARCHAR(200) NOT NULL,
		tdRimderAt DATETIME NULL, 
		tdDateExpire DATETIME NULL,

		CONSTRAINT fk_task_detail
			FOREIGN KEY (tId) REFERENCES task(tId)
	);
END;