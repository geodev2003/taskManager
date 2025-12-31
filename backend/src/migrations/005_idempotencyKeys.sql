IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'idempotency_keys'
)
BEGIN
  CREATE TABLE idempotency_keys (
    ikId INT PRIMARY KEY IDENTITY(1,1),
    uId INT NOT NULL,
    ikKey VARCHAR(100) NOT NULL,
    ikResponse NVARCHAR(MAX) NOT NULL,
    iKCreated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(uId, ikKey),

    CONSTRAINT fk_idempotency_user
    FOREIGN KEY (uId) REFERENCES users(uId)
  );
END;