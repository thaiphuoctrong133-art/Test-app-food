# PRD - Tpt Vietnamese Food Shop (Expo mobile app)

## Vision
Ứng dụng đặt món ăn Việt Nam "Tpt" với các món truyền thống: bánh bèo, bánh mì, bún, phở. Có hệ thống đăng nhập cho khách hàng và trang quản trị cho admin.

## Users
- **Customer**: Đăng ký/đăng nhập bằng email + mật khẩu, duyệt menu, thêm giỏ hàng, đặt hàng COD, xem lịch sử đơn.
- **Admin** (thaiphuoctrong133@gmail.com): Xem tổng quan doanh thu, danh sách khách hàng, quản lý đơn hàng (cập nhật trạng thái).

## Core Features (MVP)
1. **Auth (JWT + bcrypt)**: register, login, /me. Role-based: customer / admin.
2. **Menu**: 8 món đầy đủ 4 danh mục (Phở, Bánh mì, Bún, Bánh bèo). Seeded từ backend.
3. **Cart**: In-memory context. Add/remove/update quantity.
4. **Checkout**: Address + phone + note → tạo order với status "pending". COD only.
5. **My Orders**: Danh sách đơn hàng của khách + trạng thái.
6. **Admin Dashboard**: Stats (doanh thu, số đơn, số khách, số món).
7. **Admin Customers**: Danh sách khách hàng đăng ký.
8. **Admin Orders**: Tất cả đơn + chi tiết + cập nhật trạng thái (pending/confirmed/delivering/completed/cancelled).

## Tech
- Frontend: Expo Router, React Native, expo-secure-store cho token.
- Backend: FastAPI + Motor MongoDB, PyJWT, passlib+bcrypt.
- Design: Warm Vietnamese - Lacquer Red #D32F2F, Temple Gold #FFC107, Rice Paper Cream #FFF9F0.

## API endpoints (all under /api)
- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /menu
- GET /menu/{id}
- POST /orders
- GET /orders/my
- GET /admin/stats
- GET /admin/customers
- GET /admin/orders
- PATCH /admin/orders/{id}
