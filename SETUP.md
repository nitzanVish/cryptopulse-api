# Setup Guide - CryptoPulse API

## ✅ מה נוצר?

הפרויקט כולל:

### Phase 1: Infrastructure ✅
- ✅ TypeScript configuration
- ✅ Express server עם ConfigServer pattern
- ✅ Winston logger
- ✅ Environment variables validation (Zod)
- ✅ Graceful shutdown

### Phase 2: Data Layer ✅
- ✅ MongoDB connection (Singleton)
- ✅ Redis connection (Singleton)
- ✅ Mongoose models (Sentiment, CoinConfig)
- ✅ Repository pattern (SentimentRepository, CoinConfigRepository)

### Phase 3: Business Logic ✅
- ✅ NewsService (CryptoPanic / NewsAPI)
- ✅ AiService (Google Gemini)
- ✅ SentimentService (Orchestrator)

### Phase 4: Job Engine ✅
- ✅ BullMQ Queue (Producer)
- ✅ BullMQ Worker (Consumer)
- ✅ Scheduler (Cron job)

### Phase 5: API ✅
- ✅ SentimentController
- ✅ Routes (`/api/v1/sentiment/:symbol`)
- ✅ Redis caching strategy

### Phase 6: Monitoring ✅
- ✅ Health check endpoint (`/health`)
- ✅ Error handling middleware
- ✅ Request logging

## 🚀 איך להריץ?

### 1. התקנת Dependencies
```bash
cd /Users/nitzan/reactjs/cryptopulse-api
npm install
```

### 2. הגדרת Environment Variables
```bash
cp .env.example .env
# ערוך את .env והוסף את ה-API keys שלך
```

### 3. ודא ש-MongoDB ו-Redis רצים
```bash
# MongoDB (אם local)
mongod

# Redis (אם local)
redis-server
```

### 4. הרצה
```bash
npm run dev
```

## 📋 Checklist לפני הרצה

- [ ] Node.js 18+ מותקן
- [ ] MongoDB מותקן ורץ (או Atlas מוגדר)
- [ ] Redis מותקן ורץ (או cloud מוגדר)
- [ ] `.env` קובץ נוצר עם כל ה-keys
- [ ] `GEMINI_API_KEY` מוגדר
- [ ] לפחות אחד מה-News APIs מוגדר (`NEWS_API_KEY` או `CRYPTOPANIC_API_KEY`)

## 🔗 API Keys - איפה להשיג?

1. **Gemini API**: https://makersuite.google.com/app/apikey
2. **CryptoPanic**: https://cryptopanic.com/developers/api/ (מומלץ!)
3. **NewsAPI**: https://newsapi.org/ (חלופה)

## 🧪 בדיקה מהירה

לאחר שהשרת רץ:

```bash
# Health check
curl http://localhost:3001/health

# Root endpoint
curl http://localhost:3001/

# Get sentiment (אחרי שהג'ובים רצו)
curl http://localhost:3001/api/v1/sentiment/BTC
```

## 📝 הערות חשובות

1. **Scheduler**: רץ אוטומטית כל 30 דקות (ניתן לשנות ב-`.env`)
2. **Rate Limiting**: Worker מוגבל ל-10 ג'ובים לדקה (Gemini API limits)
3. **Caching**: תוצאות נשמרות ב-Redis ל-1 שעה
4. **Default Coins**: BTC, ETH, SOL מאותחלים אוטומטית

## 🐛 בעיות נפוצות

### "MongoDB connection failed"
- ודא ש-MongoDB רץ: `mongod`
- בדוק את ה-`MONGODB_URI` ב-`.env`

### "Redis connection failed"
- ודא ש-Redis רץ: `redis-server`
- בדוק את ה-`REDIS_HOST` ו-`REDIS_PORT`

### "No news API configured"
- ודא שיש לפחות אחד: `NEWS_API_KEY` או `CRYPTOPANIC_API_KEY`

## 🎯 השלבים הבאים

1. **Frontend Integration**: חיבור ה-React dashboard ל-API
2. **UI Components**: הוספת Badge ו-Tooltip ל-sentiment
3. **Testing**: הוספת unit tests ו-integration tests
4. **Monitoring**: הוספת metrics ו-dashboard
