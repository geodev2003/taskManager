IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'subscriptions'
)
BEGIN
    CREATE TABLE subscriptions (
        sId INT PRIMARY KEY IDENTITY(1,1),
        uId INT NOT NULL,
        sEndpoint NVARCHAR(MAX) NOT NULL,
        sKeysP256dh NVARCHAR(MAX) NOT NULL,
        sKeysAuth NVARCHAR(MAX) NOT NULL,
        sCreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_subscription_user FOREIGN KEY (uId) REFERENCES users(uId)
    );
END;

IF NOT EXISTS (
  SELECT 1 
  FROM sys.columns 
  WHERE Name = N'tdReminderSent'
  AND Object_ID = Object_ID(N'taskDetails')
)
BEGIN
    ALTER TABLE taskDetails
    ADD tdReminderSent BIT DEFAULT 0;
END;
