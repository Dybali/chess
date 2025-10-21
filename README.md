# FileChess - Satranç Turnuva Sistemi

Modern ve kullanıcı dostu turnuva yönetim sistemi ile satranç topluluğunuzu organize edin.

## Özellikler

- ELO Rating Sistemi
- Otomatik Eşleşme (Swiss Sistemi)
- Turnuva Yönetimi
- Oyuncu Profilleri
- Admin Paneli
- Canlı Sonuç Takibi

## Teknolojiler

- Next.js 14
- TypeScript
- Supabase
- ShadcnUI
- Vercel

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Geliştirme sunucusunu başlat
pnpm dev

# Tarayıcıda aç
http://localhost:3000
```

## Ortam Değişkenleri

`.env.local` dosyasında aşağıdaki değişkenleri tanımlayın:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```