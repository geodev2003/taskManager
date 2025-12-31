IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'refresh_tokens')
BEGIN
  CREATE TABLE refresh_tokens (
    rtId INT PRIMARY KEY IDENTITY(1,1),
    uId INT NOT NULL,
    token NVARCHAR(500) NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    revokedAt DATETIME NULL,

    CONSTRAINT fk_refresh_user
      FOREIGN KEY (uId) REFERENCES users(uId)
  );
END