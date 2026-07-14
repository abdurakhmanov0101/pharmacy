#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  AptekaSaaS — Server Deploy Script
#  Server: 95.182.119.84 | User: webdevaj
# ═══════════════════════════════════════════════════════════
set -e

APP_DIR="/var/www/aptekasaas"
REPO_URL="https://github.com/abdurakhmanov0101/pharmacy.git"

echo "🚀 AptekaSaaS deployment boshlandi..."

# ── 1. Papka yaratish ────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
  echo "📁 Papka yaratilmoqda..."
  sudo mkdir -p $APP_DIR
  sudo chown -R $USER:$USER $APP_DIR
fi

# ── 2. Kodni olish ───────────────────────────────────────
cd $APP_DIR
if [ -d ".git" ]; then
  echo "📥 Yangilanmoqda (git pull)..."
  git pull origin main
else
  echo "📥 Klonlanmoqda..."
  git clone $REPO_URL .
fi

# ── 3. Backend sozlash ───────────────────────────────────
echo "⚙️  Backend sozlanmoqda..."
cd $APP_DIR/backend
npm install --production=false

# .env yaratish (agar mavjud bo'lmasa)
if [ ! -f ".env" ]; then
  cat > .env << 'ENVEOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="apteka_saas_production_secret_2026_xavfsiz"
PORT=3001
ENVEOF
  echo "✅ .env yaratildi"
fi

# Prisma
npx prisma generate
npx prisma db push --accept-data-loss
node prisma/seed.js || echo "⚠️  Seed allaqachon qo'yilgan yoki xatolik"

# Build
npm run build

# ── 4. Frontend sozlash ──────────────────────────────────
echo "⚙️  Frontend sozlanmoqda..."
cd $APP_DIR/frontend
npm install

# .env.local yaratish
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
ENVEOF

npm run build

# ── 5. PM2 bilan ishga tushirish ────────────────────────
echo "🔄 PM2 bilan ishga tushirilmoqda..."

# Backend
cd $APP_DIR/backend
pm2 delete apteka-backend 2>/dev/null || true
pm2 start dist/src/main.js --name apteka-backend

# Frontend  
cd $APP_DIR/frontend
pm2 delete apteka-frontend 2>/dev/null || true
pm2 start npm --name apteka-frontend -- start -- -p 3100

pm2 save
echo "✅ PM2 saqlanidi"

# ── 6. Nginx sozlash ────────────────────────────────────
echo "🌐 Nginx sozlanmoqda..."

NGINX_CONF="/etc/nginx/sites-available/aptekasaas"
sudo tee $NGINX_CONF > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name apteka.webdevaj.uz;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Enable site
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/aptekasaas
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOY MUVAFFAQIYATLI YAKUNLANDI!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  🌐 Sayt:  http://apteka.webdevaj.uz"
echo "  🌐 yoki:  http://95.182.119.84:3100"
echo ""
echo "  📋 Demo Akkauntlar:"
echo "  ─────────────────────────────────────────"
echo "  Admin:     admin@apteka.uz     | Admin1234"
echo "  Menejer:   manager@apteka.uz   | Manager123"
echo "  Sotuvchi1: sotuvchi1@apteka.uz  | Sotuvchi1"
echo "  Sotuvchi2: sotuvchi2@apteka.uz  | Sotuvchi2"
echo "  Farmatsevt: farmatsevt@apteka.uz | Farma123"
echo "═══════════════════════════════════════════════════"
