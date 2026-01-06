# Task Manager Frontend

Frontend cho Task Manager, xây dựng với React + Vite + Tailwind CSS.

## Tính năng

- Đăng ký/Đăng nhập
- Quản lý task (CRUD)
- Search và pagination
- Filter theo status
- Xử lý version conflict (409)
- Xem lịch sử thay đổi (Audit)
- Responsive design
- Loading và error states

## Yêu cầu

- Node.js >= 16.x
- npm hoặc yarn

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Chạy development server

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173`

### 4. Build production

```bash
npm run build
```

## Cấu trúc

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth)
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── utils/           # Utilities (API config)
├── public/              # Static files
└── package.json
```

## Tính năng chính

### Authentication
- Login/Register pages
- JWT token management
- Auto refresh token
- Protected routes

### Task Management
- Task list với search + pagination
- Filter theo status
- Create/Edit task
- Delete task (soft delete)
- View task details

### Version Conflict Handling
- Hiển thị dialog khi có conflict (409)
- Cho phép reload data mới
- Giữ version khi edit

### Audit Log
- Tab "Lịch sử thay đổi" trong task detail
- Hiển thị before/after data
- Chỉ chủ sở hữu xem được

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS
