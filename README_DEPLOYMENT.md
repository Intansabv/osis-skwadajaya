# E-OSIS SKWADA — Deployment Online

## Arsitektur

Project ini menggunakan **Vercel sebagai frontend** dan **Supabase sebagai database/storage pusat**. Semua laptop admin dan siswa harus membuka URL Vercel yang sama. Tidak perlu menjalankan server lokal di laptop siswa.

`GitHub → Vercel → Supabase`

## 1. Supabase

1. Buka project Supabase yang digunakan oleh `.env` lokal.
2. Jalankan `supabase/complete_setup.sql` pada SQL Editor.
3. Jika database sudah pernah dibuat menggunakan migration 001–005, jalankan juga `supabase/migrations/006_production_sync.sql`.
4. Pastikan tabel `elections`, `candidates`, `voter_tokens`, `votes`, `admin_profiles` dan Storage bucket `school-assets` serta `candidate-images` tersedia.

### Membuat akun admin

Buat satu user admin melalui **Supabase Authentication → Users → Add user**. Gunakan email admin sekolah dan password yang akan dipakai pada halaman login E-OSIS. Jangan gunakan password demo/local. Setelah login pertama, profil admin akan dibuat/diambil dari `admin_profiles`.

## 2. Vercel Environment Variables

Pada Vercel → Project → Settings → Environment Variables, isi:

- `VITE_SUPABASE_URL` = URL project Supabase
- `VITE_SUPABASE_ANON_KEY` = anon/public key Supabase

Set untuk Production, Preview, dan Development bila diperlukan. Setelah mengubah environment variable, lakukan **Redeploy**.

## 3. GitHub

Commit dan push perubahan project ke branch yang terhubung dengan Vercel. Vercel akan membangun project menggunakan `npm run build`, menghasilkan folder `dist`, dan menampilkan SPA melalui URL Vercel.

## 4. Pengujian 2 laptop

- Laptop Admin: buka URL Vercel → login admin.
- Laptop Siswa: buka URL Vercel yang sama → halaman voting.
- Jangan menjalankan `npm run dev` di laptop siswa untuk pengujian online.
- Ubah logo dari admin, lalu buka/refresh halaman siswa. Logo harus sama karena dibaca dari tabel `elections` dan Supabase Storage.
- Tambahkan/edit kandidat dari admin, lalu refresh halaman siswa. Kandidat harus sama.
- Buat token dari admin, lalu gunakan token pada laptop siswa.
- Setelah voting, refresh dashboard hasil admin. Suara harus bertambah pada kandidat yang dipilih.
- Coba token yang sama pada perangkat lain. Sistem harus menolak karena token sudah digunakan.

## 5. Prinsip penting

Data utama **tidak boleh disimpan sebagai fallback di `localStorage` atau `data/db.json`**. `localStorage` hanya boleh digunakan untuk kebutuhan UI/session browser. Validasi token dan pencatatan suara dilakukan melalui RPC Supabase, sehingga satu token tidak dapat digunakan dua kali secara bersamaan.
