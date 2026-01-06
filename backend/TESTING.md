# Hướng dẫn Testing

File này hướng dẫn cách chạy test cho project Task Manager.

## Yêu cầu

- Node.js đã cài
- SQL Server đang chạy
- File `.env` đã config đúng thông tin kết nối DB

## Cài đặt

### 1. Cài packages

```bash
npm install
```

Sẽ cài:

- `jest`: Framework test
- `supertest`: Để test API

### 2. Config môi trường

Đảm bảo file `.env` có đủ thông tin:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=mật_khẩu
DB_NAME=taskManager
JWT_SECRET=secret_key
JWT_REFRESH_SECRET=refresh_secret
```

## Chạy Tests

### Chạy tất cả test

```bash
npm test
```

### Chạy với watch mode (tự động chạy lại khi code thay đổi)

```bash
npm run test:watch
```

### Chạy với coverage

```bash
npm run test:coverage
```

Sau khi chạy xong, mở file `backend/coverage/lcov-report/index.html` trong browser để xem coverage.

### Chạy một file test cụ thể

```bash
npm test -- auth.test.js
npm test -- tasks.test.js
```

## Kết quả mong đợi

Khi chạy `npm test`, sẽ thấy output như này:

```
Test DB connected

PASS  src/__tests__/auth.test.js
  Auth API Tests
    POST /api/auth/register
      ✓ should register a new user successfully (103 ms)
      ✓ should return 400 for invalid email format (10 ms)
      ✓ should return 400 for weak password (10 ms)
      ✓ should return 409 for duplicate email (102 ms)
    POST /api/auth/login
      ✓ should login successfully with correct credentials (169 ms)
      ✓ should return 404 for non-existent user (89 ms)
      ✓ should return 401 for incorrect password (75 ms)
      ✓ should return 400 for invalid email format (81 ms)

PASS  src/__tests__/tasks.test.js
  Tasks API Tests
    POST /api/tasks - Create Task
      ✓ should create a task successfully with idempotency key (95 ms)
      ✓ should return same result when using same idempotency key (121 ms)
      ✓ should return 400 when idempotency key is missing (8 ms)
      ✓ should return 401 when token is missing (8 ms)
    GET /api/tasks - Get Tasks List
      ✓ should get tasks list with pagination (133 ms)
      ✓ should search tasks by name (124 ms)
    PUT /api/tasks/:id - Update Task
      ✓ should update task successfully with correct version (106 ms)
      ✓ should return 409 when version mismatch (108 ms)
      ✓ should return 400 when version is missing (54 ms)
      ✓ should return 404 for non-existent task (72 ms)
    DELETE /api/tasks/:id - Soft Delete
      ✓ should soft delete task successfully (100 ms)
      ✓ should not return soft deleted task in list (109 ms)
      ✓ should return 404 for non-existent task (76 ms)
    POST /api/tasks/:id/restore - Restore Task
      ✓ should restore soft deleted task successfully (113 ms)
    GET /api/tasks/:id/audits - Get Task Audits
      ✓ should get task audits successfully (114 ms)
      ✓ should return 403 when accessing other user's task audits (254 ms)

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        4.506 s
```

## Test Cases

### 5 Test Cases Bắt Buộc (Theo yêu cầu)

1. **Login OK** - `auth.test.js`: "should login successfully with correct credentials"
2. **Tạo task + audit create** - `tasks.test.js`: "should create a task successfully with idempotency key"
3. **Soft delete không còn thấy trong list** - `tasks.test.js`: "should not return soft deleted task in list"
4. **Update version mismatch trả 409** - `tasks.test.js`: "should return 409 when version mismatch"
5. **Idempotency không tạo bản ghi mới** - `tasks.test.js`: "should return same result when using same idempotency key"

### Chi tiết Test Cases

#### 1. Auth Tests (`src/__tests__/auth.test.js`)

**Register Tests (4 test cases):**

- Register thành công với dữ liệu hợp lệ
- Trả về 400 cho email không hợp lệ
- Trả về 400 cho password yếu
- Trả về 409 cho email đã tồn tại

**Login Tests (4 test cases):**

- **Login OK** - Login thành công với credentials đúng
- Trả về 404 cho user không tồn tại
- Trả về 401 cho password sai
- Trả về 400 cho email format không hợp lệ

#### 2. Tasks Tests (`src/__tests__/tasks.test.js`)

**Create Task Tests (4 test cases):**

- **Tạo task + audit create** - Tạo task thành công và verify audit log
- **Idempotency test** - Trả về cùng kết quả khi dùng cùng idempotency key
- Trả về 400 khi thiếu idempotency key
- Trả về 401 khi thiếu token

**Get Tasks Tests (2 test cases):**

- Lấy danh sách tasks với pagination
- Search tasks theo tên

**Update Task Tests (4 test cases):**

- Update task thành công với version đúng
- Tăng version sau khi update
- Tạo audit log khi update
- **Version conflict (409)** - Trả về 409 khi version không khớp
- Trả về 400 khi thiếu version
- Trả về 404 cho task không tồn tại

**Soft Delete Tests (3 test cases):**

- Soft delete task thành công
- **Soft delete không còn thấy trong list** - Verify task đã xóa không xuất hiện
- Trả về 404 cho task không tồn tại

**Restore Tests (1 test case):**

- Restore task đã soft delete thành công

**Audit Tests (2 test cases):**

- Lấy audit logs của task
- Trả về 403 khi truy cập audit của task không phải của mình

### Thống kê

- **Tổng số test files**: 2
- **Tổng số test cases**: 24
- **Test coverage**:
  - Auth API: 100% các endpoints chính
  - Tasks API: 100% các endpoints chính
  - Edge cases: Đã cover các trường hợp lỗi phổ biến

## Cấu trúc Files

```
backend/
├── app.js                          # Express app (export, không listen)
├── server.js                       # Server entry point (listen)
├── jest.config.js                  # Jest configuration
├── package.json                    # Dependencies + test scripts
├── TESTING.md                      # File này
└── src/
    └── __tests__/
        ├── setup.js                # Test setup (DB connection)
        ├── helpers/
        │   └── testHelpers.js     # Helper functions cho tests
        ├── auth.test.js            # Auth API tests
        └── tasks.test.js           # Tasks API tests
```

### Test Helpers

File `testHelpers.js` có các helper functions:

- `createTestUser()`: Tạo user test trong DB
- `deleteTestUser()`: Xóa user test (xóa refresh_tokens trước)
- `deleteTestTask()`: Xóa task test (xóa taskDetails trước)
- `deleteIdempotencyKey()`: Xóa idempotency key
- `cleanupTestData()`: Cleanup tất cả test data
- `getTaskFromDB()`: Lấy task từ DB
- `getAuditsFromDB()`: Lấy audit logs từ DB

## Lưu ý

1. **Database**: Tests sẽ tạo và xóa dữ liệu trong database. Đảm bảo đang dùng database test, không phải production!
2. **Cleanup**: Tests tự động cleanup data sau mỗi test suite, nhưng nếu test bị crash, có thể cần cleanup thủ công.
3. **Connection**: Tests dùng cùng DB connection pool như app chính. Đảm bảo DB đang chạy trước khi chạy tests.
4. **Environment**: Tests dùng biến môi trường từ `.env`. Đảm bảo file này đã được config đúng.

## Troubleshooting

### Lỗi: "Cannot find module 'supertest'"

```bash
npm install
```

### Lỗi: "Connection timeout" hoặc "Connection is closed"

- Kiểm tra DB đang chạy
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo DB connection pool được config đúng

### Lỗi: "Foreign key constraint"

- Tests tự động cleanup, nhưng nếu test bị crash có thể cần cleanup thủ công
- Chạy cleanup trong DB:
  ```sql
  DELETE FROM taskAudits;
  DELETE FROM taskDetails;
  DELETE FROM task;
  DELETE FROM idempotency_keys;
  DELETE FROM refresh_tokens;
  DELETE FROM users;
  ```

### Lỗi: "Violation of UNIQUE KEY constraint"

- User hoặc data đã tồn tại từ test trước
- Tests tự động cleanup, nhưng nếu có vấn đề, cleanup thủ công như trên

### Tests chạy chậm

- Đảm bảo DB connection pool được config đúng
- Kiểm tra network latency đến DB
- Sử dụng test database riêng (không phải production)

### Lỗi: "Right-hand side of 'instanceof' is not callable"

- Lỗi này có thể do version conflict giữa `mssql` và `tedious`
- Thử cài đặt lại:
  ```bash
  npm install mssql@latest tedious@latest
  ```

## Tính năng nổi bật

1. **Isolation**: Mỗi test suite tự cleanup data
2. **Helpers**: Tái sử dụng code với helper functions
3. **Coverage**: Test cả happy path và error cases
4. **Realistic**: Tests dùng real DB connection
5. **Maintainable**: Code dễ đọc, dễ maintain

## Học hỏi từ code

Các test cases này minh họa:

- Cách test API endpoints với Supertest
- Cách setup và teardown test data
- Cách test authentication và authorization
- Cách test business logic (version conflict, idempotency)
- Cách test database operations
- Cách viết maintainable test code

## Tài liệu tham khảo

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MS SQL Node.js Driver](https://github.com/tediousjs/node-mssql)
