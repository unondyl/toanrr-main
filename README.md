# 🎨 Graph Coloring Tool - Toán Rời Rạc

Đây là một dự án ứng dụng web trực quan hóa các thuật toán tô màu đồ thị (Graph Coloring), phục vụ cho môn học Toán rời rạc. Dự án mô phỏng chi tiết từng bước (step-by-step animation) cách các thuật toán hoạt động để tìm ra sắc số của đồ thị.

## 📁 Cấu trúc dự án

Dự án được thiết kế theo mô hình Client - Server đơn giản với các file thành phần như sau:

* **Frontend (Giao diện người dùng):**
    * `index.html`: Cấu trúc giao diện ứng dụng, được chia làm 3 cột rõ ràng (Input, Đồ thị trực quan, Kết quả).
    * `style.css`: CSS style cho giao diện, sử dụng hiệu ứng glassmorphism và responsive cơ bản.
    * `script.js`: Xử lý logic giao diện, gọi API backend và điều khiển việc render đồ thị, hiệu ứng animation bằng thư viện `Vis.js`.
* **Backend (Xử lý thuật toán):**
    * `index.js`: Server Node.js sử dụng Express. File này chịu trách nhiệm parse dữ liệu đầu vào và chạy các thuật toán tô màu đồ thị, sau đó trả về danh sách các bước (steps) cho frontend xử lý.
* **Cấu hình & Triển khai:**
    * `package.json` & `package-lock.json`: Quản lý các thư viện phụ thuộc của Node.js (như `express`, `nodemon`).
    * `vercel.json`: Cấu hình deploy sẵn sàng cho nền tảng Vercel dưới dạng Serverless Functions.
    * `.gitignore`: Bỏ qua các file không cần thiết khi push lên Git (`node_modules`, `.env`).

## ✨ Tính năng nổi bật

* **Nhập đồ thị linh hoạt:** Hỗ trợ nhập danh sách các quan hệ cạnh trực tiếp trên giao diện văn bản (hỗ trợ cả đỉnh là số và chữ cái).
* **Trực quan hóa sinh động:** Đồ thị được vẽ tự động và tự sắp xếp bố cục tối ưu. Quá trình chọn đỉnh, gán màu được mô phỏng từng bước (animation) giúp dễ dàng theo dõi cách thuật toán chạy.
* **Tích hợp 3 thuật toán tô màu nâng cao:**
    * **Welsh-Powell:** Sắp xếp đỉnh theo bậc giảm dần và gán màu.
    * **RLF (Recursive Largest First):** Chọn đỉnh bậc cao nhất và loại bỏ các đỉnh kề để tô cùng một màu (tìm tập độc lập).
    * **DSATUR (Degree of Saturation):** Thuật toán bão hòa bậc, ưu tiên chọn các đỉnh có nhiều màu kề nhất để xử lý trước.
* **Thống kê kết quả:** Hiển thị thời gian chạy thuật toán, thông báo số lượng màu tối thiểu cần dùng (sắc số) và liệt kê chi tiết các đỉnh thuộc từng lớp màu.

## 🚀 Công nghệ sử dụng

* **Frontend:** HTML5, CSS3, JavaScript thuần, [Vis.js Network](https://visjs.org/) (vẽ đồ thị).
* **Backend:** Node.js, Express.js.
* **Môi trường:** Nodemon (cho dev).

## 🛠️ Hướng dẫn cài đặt và chạy (Local)

1. **Clone repository về máy cục bộ:**
   ```bash
   git clone [https://github.com/unondyl/toanrr-main.git](https://github.com/unondyl/toanrr-main.git)
   cd toanrr-main
2. **Cài đặt thư viện cần thiết**
   ```bash
   npm install
   npm install express
