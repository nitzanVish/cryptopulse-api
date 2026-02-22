# CryptoPulse API

Backend API for AI-driven cryptocurrency market sentiment analysis using Google Gemini AI.

## 🏗️ Architecture

- **Pattern**: Producer-Consumer with BullMQ
- **Database**: MongoDB (persistent storage)
- **Cache**: Redis (caching + BullMQ storage)
- **Queue**: BullMQ (job processing with retry & rate limiting)
- **AI**: Google Gemini API
- **News Sources**: NewsAPI / CryptoCompare

For a deep dive into the technical decisions, scaling challenges, and rate-limiting strategies used in this project, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your API keys and configuration:
   - **GEMINI_API_KEY**: Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **News API** (choose one):
     - `NEWS_API_KEY`: Get from [NewsAPI](https://newsapi.org/) (free tier available)
     - `CRYPTOCOMPARE_API_KEY`: Get from [CryptoCompare](https://www.cryptocompare.com/cryptopian/api-keys) (recommended for crypto news)
   - **MONGODB_URI**: 
     - Local: `mongodb://localhost:27017/cryptopulse`
     - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/cryptopulse`
   - **REDIS**: Use your Redis cloud provider's connection details (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`)

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── config/           # Environment, DB, Redis config
├── constants/        # Shared constants (messages, status codes, config values)
├── controllers/      # Request handlers
├── dtos/             # Data Transfer Objects & Zod validation schemas
├── jobs/             # BullMQ logic
│   ├── queue.ts      # Queue setup & Producer
│   ├── worker.ts     # Consumer logic
│   └── scheduler.ts  # Cron dispatcher
├── middlewares/      # Error handling, rate limiting, logging, validation
├── models/           # Mongoose schemas
├── repositories/     # Data access layer
├── routes/           # API routes
├── services/         # Business logic (News, AI, Sentiment, Redis, DB)
├── types/            # TypeScript types
└── utils/            # Logger, error classes, helpers
```

## 🔄 Data Flow

1. **Scheduler** (Cron) → Adds jobs to queue every 2 hours
2. **Queue** → Manages rate limiting and retries
3. **Worker** → Processes jobs:
   - Fetches news headlines
   - Compares against last analyzed article date (skips AI if no new content)
   - Analyzes with Gemini AI (only when new articles exist)
   - Saves to MongoDB
   - Updates Redis cache
4. **API** → Serves cached results instantly

## 📊 API Endpoints

### Root
```
GET /
```

Response:
```json
{
  "message": "CryptoPulse API",
  "version": "1.0.0"
}
```

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-22T10:00:00.000Z",
  "services": {
    "database": "up",
    "redis": "up",
    "bullmq": "up"
  }
}
```

Returns `503 Service Unavailable` if any service is down.

### Get Sentiment (Single Symbol)
```
GET /api/v1/sentiment/:symbol
```

Example: `GET /api/v1/sentiment/BTC`

Response:
```json
{
  "symbol": "BTC",
  "status": "Bullish",
  "score": 85,
  "summary": "Strong institutional inflow expected following ETF news.",
  "updatedAt": "2026-02-22T10:30:00.000Z",
  "lastArticleDate": "2026-02-22T09:15:00.000Z"
}
```

### Get All Sentiments
```
GET /api/v1/sentiment
```

Response:
```json
[
  {
    "symbol": "BTC",
    "status": "Bullish",
    "score": 85,
    "summary": "...",
    "updatedAt": "2026-02-22T10:30:00.000Z",
    "lastArticleDate": "2026-02-22T09:15:00.000Z"
  },
  {
    "symbol": "ETH",
    "status": "Neutral",
    "score": 55,
    "summary": "...",
    "updatedAt": "2026-02-22T10:30:00.000Z",
    "lastArticleDate": "2026-02-22T08:45:00.000Z"
  }
]
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `REDIS_HOST` | Redis host | Required |
| `REDIS_PORT` | Redis port | Required |
| `REDIS_PASSWORD` | Redis password | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `NEWS_API_KEY` | NewsAPI key | Optional* |
| `NEWS_API_BASE_URL` | NewsAPI base URL override | Optional |
| `CRYPTOCOMPARE_API_KEY` | CryptoCompare API key | Optional* |
| `CRYPTOCOMPARE_BASE_URL` | CryptoCompare base URL override | Optional |
| `FRONTEND_URL` | Frontend URL for CORS | Optional |
| `SENTIMENT_ANALYSIS_INTERVAL` | Cron schedule for analysis | `0 */2 * * *` (every 2 hours) |
| `RATE_LIMIT_MAX_JOBS` | Max BullMQ jobs per minute | `4` |
| `JOB_RETRY_ATTEMPTS` | Retry attempts for failed jobs | `3` |
| `JOB_BACKOFF_DELAY` | Delay between retries (ms) | `5000` |
| `RATE_LIMIT_WINDOW_MS` | HTTP rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max HTTP requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |

\* At least one of `NEWS_API_KEY` or `CRYPTOCOMPARE_API_KEY` must be provided.

### Default Coins

The system automatically initializes these coins on first run:
- **BTC** (Bitcoin) - Priority: 100
- **ETH** (Ethereum) - Priority: 90
- **SOL** (Solana) - Priority: 80

To add more coins, you can use MongoDB directly or add an admin endpoint.

## 🏃 Running the System

### Development Mode
```bash
npm run dev
```

This will:
- Start the Express server on port 3001
- Connect to MongoDB and Redis
- Start the BullMQ worker
- Start the scheduler (runs every 2 hours)

### Production Mode
```bash
npm run build
npm start
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check Atlas connection string
- Check firewall settings if using cloud MongoDB

### Redis Connection Issues
- Verify `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in `.env`
- Check that your Redis cloud instance allows connections from your IP

### API Key Issues
- Verify your Gemini API key is valid
- Check rate limits on your API keys
- Ensure at least one news API key is configured (`NEWS_API_KEY` or `CRYPTOCOMPARE_API_KEY`)

## 📝 License

MIT
