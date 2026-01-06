# Task Manager API

## Tính năng chính

- Đăng ký/đăng nhập với JWT
- CRUD task đầy đủ
- Optimistic Concurrency Control (chống 2 người cùng sửa ghi đè lên nhau)
- Audit log (lịch sử thay đổi)
- Soft delete (xóa mềm, có thể khôi phục)
- Idempotency (gửi lại request không tạo duplicate)
- Search và pagination
- Rate limiting cho login

## Yêu cầu

- Node.js (dùng version 16 trở lên)
- SQL Server (2012 trở lên là được)
- npm hoặc yarn

## Cài đặt

### Bước 1: Clone project

```bash
git clone <link-repo>
cd taskManager/backend
```

### Bước 2: Cài packages

```bash
npm install
```

### Bước 3: Setup .env

Copy file `.env.example` thành `.env`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Rồi mở file `.env` và điền thông tin:

```env
# Database
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=mật_khẩu_của_bạn
DB_NAME=taskManager

# JWT - nên đặt JWT_SECRET và JWT_ACCESS_SECRET giống nhau
JWT_SECRET=secret_key_của_bạn
JWT_ACCESS_SECRET=secret_key_của_bạn
JWT_REFRESH_SECRET=refresh_secret_key_của_bạn
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
```

**Lưu ý:** JWT_SECRET và JWT_ACCESS_SECRET nên đặt giống nhau vì code dùng cả 2 chỗ.

### Bước 4: Chạy migration

```bash
npm run migrate
```

Lệnh này sẽ tạo các bảng trong database.

### Bước 5: (Tùy chọn) Seed data

Nếu muốn có data mẫu để test:

```bash
npm run seed
```

### Bước 6: Chạy server

```bash
# Development (có nodemon tự restart)
npm run dev

# Production
npm start
```

Server sẽ chạy ở `http://localhost:3000`

## Test

Viết test cases rồi, xem file `TESTING.md` để biết chi tiết.

```bash
# Chạy tất cả test
npm test

# Chạy test với watch mode
npm run test:watch

# Xem coverage
npm run test:coverage
```

## API Documentation

Base URL: `http://localhost:3000/api`

**Lưu ý:** Tất cả API (trừ auth) đều cần header:

```
Authorization: Bearer <access_token>
```

---

## Auth APIs

### 1. Đăng ký

**POST** `/auth/register`

```json
{
  "uName": "Nguyễn Văn A",
  "uEmail": "nguyenvana@example.com",
  "uPassword": "MatKhau123!@#",
  "uPhone": "0123456789"
}
```

**Yêu cầu password:**

- Tối thiểu 6 ký tự
- Có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)

**Response:**

```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "userId": 1
  }
}
```

**Lỗi:**

- 400: Dữ liệu không hợp lệ
- 409: Email đã tồn tại

---

### 2. Đăng nhập

**POST** `/auth/login`

**Rate limit:** 5 lần / 15 phút (để tránh brute force)

```json
{
  "uEmail": "nguyenvana@example.com",
  "uPassword": "MatKhau123!@#"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "uId": 1,
      "uName": "Nguyễn Văn A",
      "uEmail": "nguyenvana@example.com",
      "uRole": "user"
    }
  }
}
```

**Lỗi:**

- 400: Dữ liệu không hợp lệ
- 401: Sai mật khẩu
- 404: Không tìm thấy user
- 429: Quá nhiều request (rate limit)

---

### 3. Refresh token

**POST** `/auth/refresh`

Khi access token hết hạn, dùng refresh token để lấy access token mới.

```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

---

### 4. Đăng xuất

**POST** `/auth/logout`

```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

## Task APIs

### 1. Tạo task

**POST** `/tasks`

**Bắt buộc:** Header `Idempotency-Key` để tránh tạo duplicate khi retry.

**Headers:**

```
Authorization: Bearer <token>
Idempotency-Key: unique-key-123
```

**Body:**

```json
{
  "tName": "Hoàn thành báo cáo",
  "tContent": "Viết báo cáo cuối kỳ",
  "tRimderAt": "2024-12-31T10:00:00Z",
  "tDateExpire": "2024-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tId": 1,
    "tName": "Hoàn thành báo cáo",
    "tStatus": "todo",
    "tVersion": 1,
    "tContent": "Viết báo cáo cuối kỳ",
    "tRimderAt": "2024-12-31T10:00:00Z",
    "tDateExpire": "2024-12-31T23:59:59Z"
  }
}
```

**Lưu ý:** Nếu gửi lại request với cùng `Idempotency-Key` trong 24h, sẽ trả về kết quả cũ (không tạo mới).

---

### 2. Lấy danh sách task

**GET** `/tasks?search=&page=&limit=`

**Query params:**

- `search`: Tìm theo tên (optional)
- `page`: Số trang (mặc định 1)
- `limit`: Số item mỗi trang (mặc định 10)

**Ví dụ:**

```
GET /tasks?search=báo cáo&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "tId": 1,
        "tName": "Hoàn thành báo cáo",
        "tStatus": "todo",
        "tVersion": 1
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}
```

**Lưu ý:** Task đã soft delete sẽ không hiện trong list.

---

### 3. Cập nhật task

**PUT** `/tasks/:id`

**Quan trọng:** Phải gửi `version` hiện tại để tránh conflict khi 2 người cùng sửa.

**Body:**

```json
{
  "tName": "Tên task mới",
  "tStatus": "in_progress",
  "version": 1
}
```

**Response:**

```json
{
  "message": "Task updated successfully",
  "data": {
    "tId": 1,
    "tName": "Tên task mới",
    "tStatus": "in_progress",
    "tVersion": 2
  }
}
```

**Lỗi đặc biệt - 409 Conflict:**
Khi version không khớp (có người khác đã sửa trước đó):

```json
{
  "code": "TASK_VERSION_CONFLICT",
  "message": "Task data has changed, please reload",
  "requestId": "uuid-here"
}
```

**Cách xử lý:**

- Frontend nên hiện thông báo "Dữ liệu đã thay đổi, bạn có muốn reload không?"
- Reload task mới nhất và cho user quyết định có update tiếp không

**Lưu ý:**

- Version tự động tăng sau mỗi lần update
- Mỗi update sẽ ghi audit log

---

### 4. Xóa task (soft delete)

**DELETE** `/tasks/:id`

Xóa mềm, task vẫn còn trong DB nhưng không hiện trong list.

**Response:**

```json
{
  "message": "Task soft deleted successfully"
}
```

---

### 5. Khôi phục task

**POST** `/tasks/:id/restore`

Khôi phục task đã bị soft delete.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Task restored successfully"
  }
}
```

---

### 6. Xem lịch sử thay đổi (Audit)

**GET** `/tasks/:id/audits`

Chỉ chủ sở hữu task mới xem được.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "taAction": "UPDATE",
      "taBeforeData": "{\"tName\":\"Tên cũ\",\"tStatus\":\"todo\",\"tVersion\":1}",
      "taAfterData": "{\"tName\":\"Tên mới\",\"tStatus\":\"in_progress\",\"tVersion\":2}",
      "taCreateAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "taAction": "CREATE",
      "taBeforeData": null,
      "taAfterData": "{\"tId\":1,\"tName\":\"Tên task\",\"tStatus\":\"todo\",\"tVersion\":1}",
      "taCreateAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

---

### 7. Xóa vĩnh viễn (Admin only)

**DELETE** `/tasks/:id/hard`

Chỉ admin mới dùng được endpoint này.

---

## Error Response

Tất cả lỗi đều có format:

```json
{
  "code": "ERROR_CODE",
  "message": "Thông báo lỗi",
  "details": {
    "field": ["Chi tiết lỗi"]
  },
  "requestId": "uuid-here",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Các mã lỗi thường gặp:**

- `VALIDATION_ERROR`: Dữ liệu không hợp lệ
- `UNAUTHORIZED`: Chưa đăng nhập hoặc token hết hạn
- `FORBIDDEN`: Không có quyền
- `NOT_FOUND`: Không tìm thấy
- `TASK_VERSION_CONFLICT`: Version conflict (409)
- `EMAIL_ALREADY_EXISTS`: Email đã tồn tại (409)
- `TOO_MANY_REQUESTS`: Quá nhiều request (429)

---

## Cấu trúc project

```
backend/
├── src/
│   ├── config/          # Config database
│   ├── controllers/     # Xử lý request
│   ├── middlewares/     # Auth, validation, error
│   ├── migrations/      # SQL migrations
│   ├── routes/          # Định nghĩa routes
│   ├── seeds/           # Data mẫu
│   ├── services/        # Business logic
│   ├── utils/           # JWT, AppError
│   ├── validators/      # Zod schemas
│   └── __tests__/       # Test files
├── app.js               # Express app (cho test)
├── server.js            # Entry point
└── package.json
```

---

## Một số lưu ý

### Optimistic Concurrency Control

Khi update task, phải gửi `version`. Nếu version không khớp (có người khác đã sửa), server trả 409. Frontend nên:

1. Hiện thông báo "Dữ liệu đã thay đổi"
2. Reload task mới
3. Cho user quyết định

### Idempotency

Khi tạo task, gửi `Idempotency-Key` header. Nếu retry với cùng key trong 24h, server trả kết quả cũ (không tạo duplicate).

### Audit Log

Mọi thao tác (CREATE, UPDATE, DELETE) đều ghi vào `taskAudits` với before/after data.

---

## Troubleshooting

**Lỗi kết nối database:**

- Kiểm tra SQL Server đang chạy
- Kiểm tra thông tin trong `.env`
- Kiểm tra firewall

**Token hết hạn:**

- Dùng refresh token để lấy access token mới
- Nếu refresh token cũng hết hạn thì phải login lại

**Lỗi 409 Version Conflict:**

- Đây là tính năng, không phải bug
- Reload task và update lại với version mới
