# Task Manager - Ứng dụng Quản lý Công việc

Project gồm 2 phần: Backend (Node.js + Express + SQL Server) và Frontend (React + Vite).

## Mô tả

Ứng dụng quản lý task với các tính năng:

- Đăng ký/đăng nhập với JWT
- CRUD task đầy đủ
- Optimistic Concurrency Control (chống 2 người cùng sửa ghi đè)
- Audit log (lịch sử thay đổi)
- Soft delete (xóa mềm, có thể khôi phục)
- Idempotency (gửi lại request không tạo duplicate)
- Search và pagination
- Rate limiting cho login
- Giao diện đẹp với Tailwind CSS

## Tech Stack

### Backend

- Node.js + Express
- SQL Server (mssql)
- JWT (Access Token + Refresh Token)
- Bcrypt (hash password)
- Zod (validation)
- Jest + Supertest (testing)

### Frontend

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- @dnd-kit (drag and drop cho Kanban)

## Cài đặt

### Yêu cầu

- Node.js >= 16.x
- SQL Server 2012 trở lên
- npm hoặc yarn

### Bước 1: Clone project

```bash
git clone <link-repo>
cd taskManager
```

### Bước 2: Setup Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=mật_khẩu_của_bạn
DB_NAME=taskManager

# JWT
JWT_SECRET=secret_key_của_bạn
JWT_ACCESS_SECRET=secret_key_của_bạn
JWT_REFRESH_SECRET=refresh_secret_key_của_bạn
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
```

Chạy migration để tạo database:

```bash
npm run migrate
```

(Tùy chọn) Seed data mẫu:

```bash
npm run seed
```

Chạy backend:

```bash
npm run dev
```

Backend sẽ chạy ở `http://localhost:3000`

### Bước 3: Setup Frontend

Mở terminal mới:

```bash
cd frontend
npm install
```

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy ở `http://localhost:5173`

## Sử dụng

1. Mở browser vào `http://localhost:5173`
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Tạo task và quản lý công việc

## Cấu trúc Project

```
taskManager/
├── backend/
│   ├── src/
│   │   ├── config/          # Config database
│   │   ├── controllers/      # Xử lý request
│   │   ├── middlewares/      # Auth, validation, error handler
│   │   ├── migrations/       # SQL migrations
│   │   ├── routes/           # Định nghĩa routes
│   │   ├── seeds/            # Data mẫu
│   │   ├── services/         # Business logic
│   │   ├── utils/            # JWT, AppError
│   │   ├── validators/       # Zod schemas
│   │   └── __tests__/        # Test files
│   ├── app.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable components
    │   ├── contexts/          # React contexts (Auth)
    │   ├── pages/             # Page components
    │   ├── services/          # API services
    │   └── utils/             # Utilities
    ├── public/
    └── package.json
```

## Tính năng chính

### 1. Optimistic Concurrency Control

Khi 2 người cùng sửa 1 task, hệ thống sẽ phát hiện conflict và trả về lỗi 409. Frontend sẽ hiện dialog cho user chọn reload data mới.

**Cách hoạt động:**

- Mỗi task có field `version` (int)
- Khi update, phải gửi `version` hiện tại
- Backend check version, nếu không khớp → 409 Conflict
- Frontend xử lý bằng dialog "Dữ liệu đã thay đổi, reload?"

### 2. Audit Log

Mọi thao tác (CREATE, UPDATE, DELETE) đều được ghi vào bảng `taskAudits` với:

- `taskId`: ID của task
- `userId`: Người thực hiện
- `action`: CREATE/UPDATE/DELETE
- `beforeData`: Dữ liệu trước khi thay đổi (JSON)
- `afterData`: Dữ liệu sau khi thay đổi (JSON)
- `createdAt`: Thời gian

Chỉ chủ sở hữu task mới xem được audit log của task đó.

### 3. Soft Delete

Xóa task không xóa thật trong database, chỉ set `deletedAt`. Có thể khôi phục bằng endpoint `/tasks/:id/restore`.

### 4. Idempotency

Khi tạo task, gửi header `Idempotency-Key`. Nếu gửi lại request với cùng key trong 24h, server trả về kết quả cũ (không tạo duplicate).

### 5. Rate Limiting

Login có rate limit: tối đa 5 lần trong 3 phút. Nếu vượt quá sẽ phải đợi 60 giây mới đăng nhập lại được.

## API Documentation

Xem chi tiết trong file `backend/README.md`

Một số endpoint chính:

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/tasks` - Lấy danh sách task (có search + pagination)
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task (soft delete)
- `POST /api/tasks/:id/restore` - Khôi phục task
- `GET /api/tasks/:id/audits` - Xem lịch sử thay đổi

## Testing

Backend có test cases, chạy bằng:

```bash
cd backend
npm test
```

Có 5 test cases:

1. Login thành công
2. Tạo task + audit log
3. Soft delete không còn thấy trong list
4. Update version mismatch trả 409
5. Idempotency không tạo duplicate

## Troubleshooting

**Lỗi kết nối database:**

- Kiểm tra SQL Server đang chạy chưa
- Kiểm tra thông tin trong `.env` đúng chưa
- Kiểm tra firewall có chặn port 1433 không

**Frontend không kết nối được backend:**

- Kiểm tra backend đang chạy ở port 3000
- Kiểm tra `VITE_API_URL` trong `.env` của frontend
- Kiểm tra CORS đã bật chưa

**Token hết hạn:**

- Access token hết hạn sau 15 phút
- Dùng refresh token để lấy access token mới
- Refresh token hết hạn sau 7 ngày, phải login lại

**Lỗi 409 Version Conflict:**

- Đây là tính năng, không phải bug
- Có nghĩa là có người khác đã sửa task trước đó
- Reload task và update lại với version mới

## 📌 Lưu ý

- Password phải có: chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)
- Tất cả API (trừ auth) đều cần header `Authorization: Bearer <token>`
- Khi tạo task, nên gửi header `Idempotency-Key` để tránh duplicate
- Khi update task, nhớ gửi `version` để tránh conflict
