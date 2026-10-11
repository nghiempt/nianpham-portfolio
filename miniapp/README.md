# Smart Insight Space — Zalo Mini App

App ID: `2872853999094342492`

Màn hình hiện tại là Mind Map. UI được làm và xem trước trên web tại `/mind-map`
(`app/mind-map/`), chốt xong thì copy sang `src/mind-map/`: `mind-map.tsx`,
`note-editor.tsx`, `mind-map.css` giữ nguyên; riêng `storage.ts` khác (dùng
`nativeStorage` của Zalo thay cho `localStorage`).

Màn hình hub cũ (logo ở giữa) vẫn còn trên web tại `/miniapp`.

Dữ liệu: mini app **chỉ xem**. Mỗi lần mở, nó đọc mind map từ
`https://www.nianpham.my/api/mind-map` bằng key trong `.env.local`
(`VITE_MIND_MAP_READ_KEY`, phải trùng `MIND_MAP_READ_KEY` trên Vercel) và lưu bản
cuối vào `nativeStorage` để xem offline. Sửa note trên web, mở lại mini app là thấy.

```bash
cd miniapp
npm install
npm start               # chạy thử trên trình duyệt (zmp start)
npx zmp login           # nhập App ID, quét QR bằng Zalo (lưu vào .env, đã gitignore)
npm run deploy          # build ra www/ rồi upload bản Development → nhận QR
npm run deploy:testing  # như trên nhưng là bản Testing
```
