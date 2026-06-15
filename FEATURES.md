# 📋 MÔ TẢ CHI TIẾT CÁC CHỨC NĂNG — HƯƠNG VIỆT AI

> **Hương Việt AI** là ứng dụng quản lý nhà hàng ẩm thực Việt Nam toàn diện, tích hợp trợ lý AI thông minh.  
> Phiên bản: **Agent 3.5** | Nền tảng: React 19 + FastAPI + LangChain Gemini

---

## MỤC LỤC

1. [Hệ thống đa vai trò (Multi-Role)](#1-hệ-thống-đa-vai-trò-multi-role)
2. [Trợ lý AI thông minh (LangChain Chatbot)](#2-trợ-lý-ai-thông-minh-langchain-chatbot)
3. [Quản lý thực đơn & Gọi món](#3-quản-lý-thực-đơn--gọi-món)
4. [Giỏ hàng & Đặt hàng](#4-giỏ-hàng--đặt-hàng)
5. [Thanh toán trực tuyến (MoMo / ZaloPay / VietQR)](#5-thanh-toán-trực-tuyến-momo--zalopay--vietqr)
6. [Theo dõi giao hàng & Bản đồ thời gian thực](#6-theo-dõi-giao-hàng--bản-đồ-thời-gian-thực)
7. [Đặt bàn nhà hàng](#7-đặt-bàn-nhà-hàng)
8. [Cuộc gọi xác nhận tự động AI](#8-cuộc-gọi-xác-nhận-tự-động-ai)
9. [Gọi thoại WebRTC thời gian thực (LiveKit)](#9-gọi-thoại-webrtc-thời-gian-thực-livekit)
10. [Xác thực & Quản lý tài khoản](#10-xác-thực--quản-lý-tài-khoản)
11. [Hệ thống thông báo Email (Resend)](#11-hệ-thống-thông-báo-email-resend)
12. [Công cụ quản trị & Chẩn đoán hệ thống](#12-công-cụ-quản-trị--chẩn-đoán-hệ-thống)

---

## 1. Hệ thống đa vai trò (Multi-Role)

Ứng dụng hỗ trợ **3 vai trò người dùng** với giao diện và quyền hạn riêng biệt, chuyển đổi linh hoạt qua thanh điều hướng trên header.

### 1.1. Khách hàng (Customer)

- **Mô tả**: Vai trò mặc định khi truy cập ứng dụng.
- **Quyền hạn**:
  - Trò chuyện với trợ lý AI để tư vấn, gọi món, đặt bàn
  - Duyệt thực đơn, tìm kiếm, lọc theo danh mục
  - Thêm món vào giỏ hàng, áp mã khuyến mãi, đặt hàng
  - Theo dõi đơn hàng trên bản đồ thời gian thực
  - Đặt bàn trực tiếp với form chi tiết
  - Thanh toán qua MoMo, ZaloPay hoặc VietQR
  - Nhận cuộc gọi xác nhận từ robot AI
  - Quản lý hồ sơ cá nhân, cấu hình ngân hàng, sở thích ẩm thực
  - Viết đánh giá và bình chọn sao cho món ăn
  - Đánh dấu món yêu thích

### 1.2. Quán ăn (Restaurant)

- **Mô tả**: Giao diện quản lý dành cho chủ nhà hàng.
- **Quyền hạn**:
  - Xem toàn bộ danh sách đơn hàng với tìm kiếm (theo tên, SĐT, mã đơn)
  - Cập nhật trạng thái đơn theo quy trình:
    - `Pending` → **Chấp nhận nấu** → `Preparing`
    - `Preparing` → **Giao cho Shipper** → `Shipping`
    - `Preparing/Shipping` → **Bàn giao xong** → `Delivered` (tự động đánh dấu đã thanh toán)
    - Bất kỳ trạng thái → **Hủy đơn** → `Cancelled`
  - Quản lý đặt bàn: xem danh sách, hủy giữ chỗ
  - Thêm món mới vào thực đơn (tên, giá, danh mục, ảnh, mô tả)
  - Trigger cuộc gọi robot AI xác nhận đơn hàng tới khách

### 1.3. Shipper (Tài xế giao hàng)

- **Mô tả**: Giao diện vận hành dành cho đội ngũ giao hàng.
- **Quyền hạn**:
  - Xem danh sách đơn hàng loại "Giao hàng" (delivery)
  - Chọn đơn để xem chi tiết: tên khách, SĐT, địa chỉ, tổng tiền thu hộ, phương thức thanh toán
  - Điều khiển GPS mô phỏng: bấm từng chặng trên route để di chuyển vị trí tài xế trên bản đồ
  - Bản đồ Leaflet hiển thị vị trí real-time đồng bộ với khách hàng
  - Xác nhận nhận đơn / Xác nhận giao hàng thành công

---

## 2. Trợ lý AI thông minh (LangChain Chatbot)

### 2.1. Chat tư vấn ẩm thực

- **Công nghệ**: LangChain + Google Gemini 2.5 Flash (temperature: 0.4)
- **Mô tả**: Chatbot AI nói tiếng Việt, đóng vai trợ lý nhà hàng Hương Việt, tư vấn món ăn dựa trên thực đơn thực tế.
- **Luồng hoạt động**:
  1. Người dùng nhập tin nhắn hoặc bấm nút gợi ý nhanh (suggestion chips)
  2. Backend phân tích tin nhắn: phát hiện intent (ý định) qua keyword matching
  3. Nếu phát hiện hành động cụ thể → thực hiện tự động (đặt món, đặt bàn, cập nhật dị ứng)
  4. Nếu không → gửi tới Gemini AI với context thực đơn + lịch sử hội thoại (tối đa 12 tin gần nhất)
- **System prompt** bao gồm:
  - Danh sách toàn bộ thực đơn (tên, giá, mô tả, tình trạng)
  - Sở thích ẩm thực và dị ứng của khách hàng (nếu đã lưu)

### 2.2. Hành động tự động (Structured Actions)

| Ý định phát hiện | Hành động tự động | Ví dụ tin nhắn |
|---|---|---|
| Dị ứng / kiêng ăn | Lưu ghi chú khẩu vị (`dietaryNotes`) | "Tôi bị dị ứng lạc và kiêng đường" |
| Yêu thích món | Thêm vào danh sách `favorites` | "Tôi thích phở bò" |
| Đặt bàn | Tạo reservation tự động | "Đặt bàn 4 người 19:30 tối nay" |
| Gọi món / Đặt món | Tìm món khớp, tạo order + thêm vào giỏ | "Gọi cho tôi 2 phần phở bò" |

### 2.3. Gợi ý trực quan (Visual Suggestion)

- Khi AI phản hồi nhắc tới tên món ăn → hệ thống tự động match với danh sách dishes
- Hiển thị **card món ăn mini** kèm hình ảnh, giá, nút "Gọi món này" và "Chi tiết"
- Cho phép thêm thẳng vào giỏ hàng từ chat

### 2.4. Fallback thông minh

- Nếu không có `GEMINI_API_KEY` → chatbot tự động liệt kê 4 món đầu tiên trong thực đơn
- Đảm bảo ứng dụng **luôn hoạt động** ngay cả khi chưa cấu hình API key

### 2.5. Nút gợi ý nhanh (Suggestion Chips)

- 🍳 "Gợi ý đặc sản tối nay" — AI tư vấn món ăn tối
- ⚠️ "Cập nhật dị ứng lạc" — Lưu thông tin dị ứng
- 📅 "Đặt bàn 4 người 19:30" — Tạo đặt bàn tự động

---

## 3. Quản lý thực đơn & Gọi món

### 3.1. Hiển thị thực đơn

- Grid 2 cột responsive, mỗi món ăn hiển thị:
  - Hình ảnh lớn (banner style) với gradient overlay
  - Tên, mô tả, giá (VNĐ), rating sao
  - Badge danh mục: Món chính / Khai vị / Đồ uống
  - Nút yêu thích (heart icon) và nút Chi tiết
- **6 món mặc định**: Phở Bò Hà Nội Truyền Thống, Bún Chả Hương Liệu, Bánh Mì Sài Gòn, Gỏi Cuốn Tôm Thịt, Cà Phê Sữa Đá, Chè Bưởi Sương Sa

### 3.2. Tìm kiếm & Lọc

- **Thanh tìm kiếm**: Tìm theo tên món, mô tả, hoặc nguyên liệu
- **Bộ lọc danh mục**: Tất cả / Món chính / Khai vị / Đồ uống
- **Trạng thái rỗng**: Hiển thị thông báo thân thiện với nút "Xoá Bộ Lọc Tìm Kiếm"

### 3.3. Chi tiết món ăn (Modal)

Popup modal full-featured khi bấm "Chi tiết":
- **Ảnh banner lớn** với gradient, badge danh mục, rating
- **Thông tin dinh dưỡng**: Calo, Protein, Carbs, Fat (grid 4 cột)
- **Nguyên liệu**: Danh sách chips với checkmark icon
- **Hướng dẫn chế biến**: Các bước nấu ăn đánh số thứ tự
- **Đánh giá & Reviews**: Hiển thị reviews có sẵn + form viết review mới (tên, sao 1-5, nhận xét)
- **Nút hành động**: Yêu thích, Thêm vào giỏ hàng

### 3.4. Đánh giá món ăn (Reviews)

- Form viết đánh giá: Tên người dùng, chọn sao (1-5), nhận xét văn bản
- Gửi review → cập nhật rating trung bình của món
- Hiển thị danh sách review với tên, ngày, số sao, nội dung

### 3.5. Yêu thích (Favorites)

- Bấm icon trái tim → toggle thêm/xóa khỏi danh sách yêu thích
- Danh sách yêu thích lưu trong preferences, đồng bộ với backend
- Hiển thị trên header nếu có favorites

### 3.6. Thêm món mới (Restaurant role)

- Form tạo món mới: Tên, giá, danh mục (Món chính/Khai vị/Đồ uống/Tráng miệng), link ảnh, mô tả
- Tự động gán ID, rating mặc định 5.0, trạng thái available

---

## 4. Giỏ hàng & Đặt hàng

### 4.1. Giỏ hàng (Shopping Cart)

- **Side panel bên phải** (5/12 columns trên desktop)
- Hiển thị: ảnh thu nhỏ, tên món, đơn giá, số lượng (tăng/giảm/xóa)
- Tổng kết:
  - Giá trị món ăn
  - Phí dịch vụ & Ship: **15.000 đ** (cố định)
  - Khuyến mãi (nếu có)
  - **Tổng tiền thanh toán**
- Trạng thái rỗng: icon giỏ hàng + nút "Dạo xem thực đơn ngay"
- Counter badge hiển thị tổng số món trên header giỏ hàng

### 4.2. Mã khuyến mãi (Promo Codes)

| Mã | Giảm giá | Điều kiện |
|---|---|---|
| `HUONGVIET20` | 20% tổng giá trị món | Không giới hạn |
| `MIENSHIP` | Miễn phí ship 15.000 đ | Cố định |
| `CHAOHUONGVIET` | Giảm tối đa 30.000 đ | Tổng ≥ 50.000 đ |

- Input nhập mã → Áp dụng → Hiển thị feedback thành công/thất bại
- Nút "Huỷ bỏ" mã đã áp dụng

### 4.3. Đặt hàng (Checkout)

- Bấm "Tiến Hành Đặt Hàng" → mở **Checkout Modal**
- Form thông tin:
  - Tên người nhận
  - Số điện thoại liên hệ
  - Loại giao hàng: **Giao tận nơi** (delivery) / **Dùng tại quán** (dine-in)
  - Địa chỉ giao hàng (chỉ hiển thị khi chọn delivery)
  - Phương thức thanh toán: **Tiền mặt** / **MoMo** / **ZaloPay**
- Tóm tắt đơn: danh sách món, phí ship, khuyến mãi, tổng cộng
- Nút "Xác nhận Đặt hàng & Ship ngay" → Gọi API tạo order → xóa giỏ hàng → mở tracking

### 4.4. Quản lý đơn hàng

- **Danh sách đơn hàng**: Panel bên phải, hiển thị lịch sử tất cả đơn
- Thông tin mỗi đơn: mã đơn (font mono), trạng thái (badge màu), danh sách món, tổng tiền, tên khách
- Tình trạng thanh toán: "ĐA THANH TOÁN" (xanh) / "CHƯA TRẢ TIỀN" (vàng)
- Nút hành động:
  - **Trả tiền** → mở Payment QR Modal
  - **Hủy đơn** → gọi API cancel
- **Glow animation**: Đơn đang theo dõi có hiệu ứng glow pulsing (motion/react)
- Trạng thái cuộc gọi AI: Hiển thị `ĐANG KẾT NỐI` / `ĐANG ĐỔ CHUÔNG` / `ĐÃ XÁC NHẬN` / `ĐÃ HỦY` / `THẤT BẠI` trên mỗi đơn

---

## 5. Thanh toán trực tuyến (MoMo / ZaloPay / VietQR)

### 5.1. Chế độ VietQR Nhanh

- Tạo mã QR chuyển khoản ngân hàng qua API `img.vietqr.io`
- Thông tin tài khoản thụ hưởng cấu hình trong tab Hồ sơ (mã ngân hàng, số tài khoản, tên chủ tài khoản)
- QR code chứa: số tiền, nội dung chuyển khoản (mã đơn hàng), tên thụ hưởng
- Nút "Tôi đã quét mã xong" → đánh dấu đơn đã thanh toán
- **Hỗ trợ chuyển tiền thật** vào tài khoản người dùng cấu hình

### 5.2. Chế độ Sandbox API (MoMo / ZaloPay)

- **MoMo Sandbox**:
  - Tạo chữ ký HMAC-SHA256 theo format chuẩn MoMo
  - Payload: partnerCode, requestId, orderId, amount, signature
  - Endpoint: `https://test-payment.momo.vn/v2/gateway/api/create`
- **ZaloPay Sandbox**:
  - Tạo chữ ký HMAC-SHA256 theo format ZaloPay
  - Payload: app_id, app_trans_id, amount, app_time, mac
  - Endpoint: `https://sb-openapi.zalopay.vn/v2/create`
- **Console Debug Terminal**: Hiển thị logs API, chữ ký, payload chi tiết
- **Toggle Mock/Live**: Chuyển đổi giữa mock environment và live test
- Nút "Giả lập Callback THÀNH CÔNG" → đánh dấu đã thanh toán
- Link redirect tới trang thanh toán sandbox thật (nếu có payUrl từ API)

---

## 6. Theo dõi giao hàng & Bản đồ thời gian thực

### 6.1. Bản đồ Leaflet OpenStreetMap

- **Công nghệ**: Leaflet.js + OpenStreetMap tiles (miễn phí, không cần API key)
- **3 marker trên bản đồ**:
  - 🏪 Nhà hàng (màu đỏ) — tọa độ cố định Hà Nội
  - 📍 Điểm giao (màu xanh dương) — tọa độ đích
  - 🛵 Tài xế (màu xanh lá, pulsing) — vị trí real-time
- **Polyline route**: Đường nét đứt nối nhà hàng → tài xế → điểm giao
- **Auto-fit bounds**: Bản đồ tự zoom để hiển thị cả 3 điểm

### 6.2. Thanh tiến trình giao hàng

- Progress bar overlay trên bản đồ hiển thị:
  - Phần trăm hoàn thành
  - Thời gian dự kiến (estimated arrival)
  - Chặng hiện tại / Tổng số chặng
  - Chi tiết chặng đường (street name)
- Trạng thái: Chờ nhà bếp → Đang trên đường → Đã giao tới nơi

### 6.3. Polling tự động

- **Customer role**: Tự động poll API `GET /api/driver-map/{orderId}` mỗi 5 giây
- **Shipper role**: Cập nhật vị trí thủ công bằng cách bấm từng chặng GPS
- Đồng bộ vị trí: shipper cập nhật → backend lưu `manualDriverStep` → customer poll nhận vị trí mới

### 6.4. Route mô phỏng

- **8 chặng** từ nhà hàng (Phố Huế, Hai Bà Trưng) đến điểm giao (Phố Cổ, Hoàn Kiếm)
- Mỗi chặng gồm: tọa độ `{lat, lng}`, tiêu đề đường phố, mô tả chi tiết
- Shipper bấm từng chặng → cập nhật `driverLocation` trên server

---

## 7. Đặt bàn nhà hàng

### 7.1. Form đặt bàn (Customer)

- **Thông tin yêu cầu**:
  - Tên liên hệ
  - Số điện thoại di động
  - Địa chỉ email xác nhận (tùy chọn)
  - Số lượng khách (1-20)
  - Thời gian đến (text tự do, ví dụ: "19:00 tối nay")
- **Khu vực ngồi**: Chọn 1 trong 4 vùng
  - 🏡 Trong nhà ấm cúng
  - 🌿 Sân vườn thoáng mát
  - 🪟 Ban công view đẹp
  - 🏮 VIP riêng tư cao cấp
- **Xử lý**: Gửi API → Server tự động gán số bàn (random 1-15) → Trạng thái "Confirmed"
- **Email xác nhận**: Nếu có email → gửi email xác nhận qua Resend

### 7.2. Đặt bàn qua AI

- Nhắn tin với chatbot: "Đặt bàn 4 người vào 19:30 tối nay"
- AI tự động trích xuất: thời gian, số khách → tạo reservation
- Phản hồi kèm thông tin xác nhận (mã đặt bàn, số bàn, khu vực)

### 7.3. Quản lý đặt bàn (Restaurant)

- Danh sách tất cả reservation: tên khách, trạng thái, khung giờ, số khách, SĐT, số bàn, khu vực
- Nút hủy giữ chỗ (icon thùng rác)

---

## 8. Cuộc gọi xác nhận tự động AI

### 8.1. Trigger cuộc gọi

- **Customer**: Bấm nút "Robot Gọi Confirm" → chọn đơn hàng → hiện popup incoming call
- **Restaurant**: Bấm nút gọi xác nhận trên mỗi đơn hàng
- Hiệu ứng: popup bouncing ở góc phải dưới, icon điện thoại pulsing

### 8.2. Nhận cuộc gọi

- Popup hiển thị: "Hương Việt AI calling...", mã đơn hàng, nút "NHẬN CUỘC GỌI" / "Tắt chặn"
- Bấm nhận → mở Phone Simulation Modal toàn màn hình

### 8.3. Phone Simulation Modal

- **Giao diện điện thoại** với:
  - Avatar bot, tiêu đề "Hương Việt AI Speech System"
  - Equalizer animation (7 thanh sóng âm động)
  - Khu vực transcript hội thoại: bot nói (bên trái) vs người dùng nói (bên phải)
  - Loading indicator khi bot đang chuẩn bị phản hồi
- **Input phản hồi**:
  - Ô nhập text tự do + nút gửi
  - 3 preset nhanh:
    - "Đúng rồi, tôi là Nam." (xác nhận)
    - "Hãy hủy đơn này hộ tôi." (hủy)
    - "Tôi đã chuyển khoản xong." (thanh toán)
- **Nút hành động trực tiếp**:
  - ✓ Đồng Ý Đơn → xác nhận đơn hàng, chuyển trạng thái `preparing`
  - ✕ Hủy Đơn Hàng → hủy đơn, chuyển trạng thái `cancelled`
- **Tổng hợp giọng nói**: Sử dụng `window.speechSynthesis` đọc phản hồi của bot bằng tiếng Việt
- Nút "Gác máy cuộc gọi" → đóng modal

### 8.4. Chatbot điện thoại (Backend)

- Phân tích keyword trong câu trả lời:
  - `đồng ý/xác nhận/ok/được` → Xác nhận đơn
  - `đổi/thay/sửa` → Ghi nhận yêu cầu điều chỉnh
  - `hủy/không lấy` → Ghi nhận hủy
  - Mặc định → Phản hồi chung "đã nghe rõ"

---

## 9. Gọi thoại WebRTC thời gian thực (LiveKit)

### 9.1. Khởi tạo cuộc gọi web

- Bấm nút "Bắt đầu gọi LiveKit" trên đơn hàng
- Frontend gọi API `POST /api/livekit/token` → nhận JWT token + URL server
- Dynamic import `livekit-client` → kết nối tới LiveKit Cloud

### 9.2. Giao diện cuộc gọi WebRTC

- **UI dark theme** (slate-900) với:
  - Trạng thái kết nối: ĐANG KẾT NỐI / LIÊN KẾT THÀNH CÔNG / ĐÃ NGẮT / LỖI
  - Micro waveform visualizer (thanh sóng bouncing khi connected)
  - Danh sách participants trong room
  - Live logs terminal với trace events
- **Tính năng**:
  - Capture microphone qua `getUserMedia`
  - Publish local audio track vào room
  - Lắng nghe participant connected/disconnected events
  - Nút "Gác máy" → disconnect room, unpublish tracks

### 9.3. JWT Token Signing (Backend)

- Tự tạo JWT token không dùng thư viện LiveKit server SDK
- Header: HS256, payload: roomJoin, canPublish, canSubscribe, canPublishData
- Ký bằng HMAC-SHA256 với `LIVEKIT_API_SECRET`
- Token hết hạn sau 600 giây (10 phút)

---

## 10. Xác thực & Quản lý tài khoản

### 10.1. Đăng nhập tài khoản nội bộ

- Form: Tên đăng nhập + Mật khẩu
- **Nút đăng nhập nhanh**: 3 nút preset cho 3 vai trò (Khách / Quán ăn / Shipper) — phục vụ demo
- Đăng nhập thành công → lưu profile vào state + `localStorage` → tự động chuyển role tương ứng
- Gửi email thông báo đăng nhập (nếu user có email)

### 10.2. Đăng ký tài khoản

- Form: Username, mật khẩu, họ tên, SĐT, địa chỉ (tùy chọn)
- **Chọn vai trò**: Khách hàng / Quán ăn / Shipper
- **Xác thực OTP điện thoại**:
  1. Nhập SĐT → bấm "Gửi mã OTP"
  2. Backend tạo mã 6 chữ số, lưu với thời hạn 5 phút
  3. Chế độ mô phỏng: hiển thị mã OTP trực tiếp trên UI
  4. Nhập mã → xác thực → hiển thị ✓ "Số điện thoại đã được xác thực"
  5. Hoàn tất đăng ký
- Gửi email chào mừng (nếu username là email)

### 10.3. Đăng nhập Google (OAuth)

- SDK `google.accounts.id` tích hợp trực tiếp
- **Google One Tap**: Prompt tự động hiện khi load trang (nếu có `GOOGLE_CLIENT_ID`)
- Nút "Tiếp tục với Google" trong auth modal
- JWT decode → trích xuất name, email, avatar
- Lưu profile với `provider: 'google'`

### 10.4. Tài khoản mặc định (Demo)

| Username | Password | Role | Tên hiển thị |
|---|---|---|---|
| `khach` | `123` | customer | Thực Khách Hà Nội |
| `quan` | `123` | restaurant | Chủ Quán Hương Việt |
| `shipper` | `123` | shipper | Trần Văn Đình |

### 10.5. Quản lý phiên

- Profile lưu trong `localStorage` key `hv_user_profile`
- Tự động restore khi reload trang
- Nút đăng xuất: xóa localStorage, reset state, chuyển về customer role

---

## 11. Hệ thống thông báo Email (Resend)

### 11.1. Gửi email tự động

- **Khi tạo đơn hàng**: Email xác nhận đơn + danh sách món + tổng tiền
- **Khi đặt bàn**: Email xác nhận reservation + thời gian + số bàn
- **Khi đăng nhập/đăng ký**: Email thông báo hoạt động tài khoản

### 11.2. Gửi email thủ công (Test)

- Tab Hồ sơ → Panel "Cổng Gửi Thư Resend.com"
- Form: Người nhận (To), Tiêu đề (Subject), Nội dung (HTML/Text)
- Nút "Gửi Thư Thử Nghiệm Qua Resend" → gọi API Resend
- Hiển thị kết quả: thành công / thất bại

### 11.3. Nhật ký email

- Danh sách lịch sử tất cả email đã gửi trong phiên
- Mỗi entry: ID, trạng thái (Thành công/Thất bại/Đang gửi), người nhận, tiêu đề, lỗi (nếu có), timestamp
- Nút "Làm mới" để reload logs

### 11.4. Fallback khi không có API key

- Nếu `RESEND_API_KEY` không cấu hình → email được ghi log ở chế độ "simulation"
- Không có lỗi, ứng dụng vẫn hoạt động bình thường

---

## 12. Công cụ quản trị & Chẩn đoán hệ thống

### 12.1. Kiểm tra kết nối Supabase PostgreSQL

- Tab Hồ sơ → Panel "Kiểm thử kết nối Supabase CSDL"
- Bấm "Bắt đầu kiểm tra kết nối" → Backend dùng `asyncpg` kết nối tới PostgreSQL
- Hiển thị kết quả:
  - ✅ Thành công: Độ trễ (ms), thời gian DB, URL (masked), phiên bản PostgreSQL
  - ❌ Thất bại: Thông báo lỗi chi tiết
- Hiển thị trạng thái biến môi trường: "ĐÃ THIẾT LẬP" / "CHƯA PHÁT HIỆN"

### 12.2. Chẩn đoán Twilio SDK

- Tab Hồ sơ → Panel "Trình Chẩn Đoán Twilio SDK"
- Bấm "Bắt Đầu Xác Thực Twilio" → truy vấn thông tin tài khoản Twilio
- Hiển thị:
  - Account SID, số tổng đài (From number)
  - Danh sách **Verified Outgoing Caller IDs** (số đã xác thực, có thể gọi/nhắn)
  - Danh sách **Số Twilio đã mua** (inbound numbers)
  - Quy tắc sử dụng tài khoản thử nghiệm
- Thông báo lỗi chi tiết nếu cấu hình sai

### 12.3. Cấu hình tài khoản ngân hàng VietQR

- Tab Hồ sơ → Panel "Tài khoản thụ hưởng VietQR"
- Nhập: Mã ngân hàng (vcb, tcb, mbb...), Số tài khoản, Họ tên thụ hưởng
- Lưu tự động vào `localStorage`
- Dùng để tạo mã QR chuyển khoản thực tế khi thanh toán

### 12.4. Cá nhân hóa khẩu vị (Preferences)

- **Ghi chú chế độ ăn**: Input text cho dị ứng, kiêng ăn, sở thích đặc biệt
- **Danh sách yêu thích**: Tự động đồng bộ từ các món đã đánh dấu heart
- Dữ liệu preferences được truyền vào system prompt của AI → chatbot tư vấn phù hợp
- Hiển thị quick tag trên header: "🎯 Cá nhân hóa: [ghi chú]"

---

## PHỤ LỤC

### A. Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend Framework | React | 19.0.1 |
| Build Tool | Vite | 6.x |
| CSS Framework | TailwindCSS | 4.x |
| Bản đồ | Leaflet + OpenStreetMap | 1.9.4 |
| Animation | Motion (framer-motion) | 12.x |
| Icons | Lucide React | 0.546.0 |
| WebRTC | LiveKit Client | 2.19.2 |
| Backend Framework | FastAPI | ≥0.115.0 |
| AI Engine | LangChain + Gemini 2.5 Flash | ≥0.3.0 |
| Database Driver | asyncpg | ≥0.29.0 |
| HTTP Client | httpx | ≥0.27.0 |

### B. Biến môi trường chính

| Biến | Service | Bắt buộc |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini AI | Không (có fallback) |
| `DATABASE_URL` | Supabase PostgreSQL | Không (chỉ test) |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | Twilio Voice/SMS | Không (simulation) |
| `RESEND_API_KEY` | Email notifications | Không (simulation) |
| `LIVEKIT_URL/API_KEY/API_SECRET` | WebRTC Calling | Không (error graceful) |
| `MOMO_PARTNER_CODE/ACCESS_KEY/SECRET_KEY` | MoMo Payment | Không (mock signature) |
| `ZALOPAY_APP_ID/KEY1/KEY2` | ZaloPay Payment | Không (mock signature) |
| `GOOGLE_CLIENT_ID` | Google OAuth | Không (nút ẩn) |

### C. Trạng thái đơn hàng (Order Flow)

```
pending → preparing → shipping → delivered
   ↓          ↓           ↓
cancelled  cancelled   cancelled
```

- **pending**: Đơn mới, chờ nhà hàng xác nhận
- **preparing**: Nhà bếp đang nấu
- **shipping**: Đã giao cho shipper, đang trên đường
- **delivered**: Giao thành công
- **cancelled**: Đã hủy (bởi khách/nhà hàng/shipper)

### D. Trạng thái cuộc gọi AI (Call Flow)

```
idle → calling → ringing → answered → confirmed/cancelled/failed
```

- **idle**: Chưa có cuộc gọi
- **calling**: Đang kết nối
- **ringing**: Đang đổ chuông
- **answered**: Đã nghe máy
- **confirmed**: Khách xác nhận đơn
- **cancelled**: Khách hủy đơn qua điện thoại
- **failed**: Cuộc gọi thất bại

docker compose up -d

docker compose down

docker run --name foodhouse_tunnel --rm --network foodhouse_default cloudflare/cloudflared:latest tunnel --url http://frontend:80

docker rm -f foodhouse_tunnel
