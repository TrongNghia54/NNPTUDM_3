# NNPTUDM_3

## Mô tả ngắn
- Bài tập: Sử dụng API https://api.escuelajs.co/api/v1/products
- Yêu cầu hiện tại: Viết hàm `getall` cho dashboard để tải và hiển thị sản phẩm trong bảng; CSS bảng yêu cầu **1 dòng đen và 1 dòng trắng**; hiển thị toàn bộ hình (không crop).

## File đã thêm ✅
- `test.html` — giao diện dashboard (mở bằng trình duyệt)
- `style.css` — CSS cho bảng (giao diện được làm mới: màu nhẹ nhàng, nút đẹp và ảnh hiển thị đầy đủ)
- `main.js` — chứa hàm `getall()` (gọi API, render dữ liệu vào bảng; **proxy-first (bây giờ luôn proxy)** cho ảnh (images.weserv.nl) để tránh chặn hotlink; nếu proxy không thể tạo URL thì dùng URL gốc, sau đó hiển thị placeholder nếu vẫn thất bại), `search-title` để tìm theo `title` (cập nhật realtime khi nhập), và phân trang (chọn 5/10/20 mục mỗi trang).

## Hướng dẫn nhanh
1. Mở `NNPTUDM_3/test.html` trong trình duyệt.
2. Trang sẽ tự động gọi `getall()` để tải dữ liệu. Bạn cũng có thể bấm nút "Tải sản phẩm".
3. Chụp màn hình sau khi từng chức năng hoàn thiện và nộp cùng file `.html` và `.js` lên GitHub.

> Ghi chú: Nếu API trả về trường `images` là mảng, ảnh đầu tiên sẽ được dùng; nếu không có thì dùng `image`.
2280602074 - Nguyễn Trọng Nghĩa