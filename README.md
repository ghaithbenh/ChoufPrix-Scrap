# 🛒 Scraper Project

A Node.js + TypeScript price scraping system for Tunisian e-commerce stores. Scrapes product data using **Playwright**, stores it in **MongoDB Atlas**, and queues jobs via **BullMQ + Redis**.

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Language |
| Playwright | Browser automation for scraping |
| Mongoose | MongoDB ODM |
| BullMQ + ioredis | Job queue & Redis connection |
| dotenv | Environment variable management |

---

## Folder Structure

```
scraper-project/
├── src/
│   ├── models/
│   │   ├── product.ts           # Product Mongoose model + interface
│   │   └── priceHistory.ts      # PriceHistory Mongoose model + interface
│   ├── scraper/
│   │   ├── scrapeMyTek.ts       # Scraper for mytek.tn
│   │   ├── scrapeTunisianet.ts  # Scraper for tunisianet.com.tn
│   │   └── scrapeScoop.ts       # Scraper for scoop.com.tn
│   ├── queue/
│   │   └── worker.ts            # BullMQ worker — processes scrape jobs
│   ├── scheduler/
│   │   └── cron.ts              # Schedules recurring scrape jobs every 6h
│   ├── updateProducts.ts        # Upsert logic — insert or update price history
│   ├── index.ts                 # App entry point — connects MongoDB, starts worker & scheduler
│   └── test.ts                  # Manual one-off script — add jobs to queue & exit
├── .env                         # Environment variables (MONGO_URI)
├── tsconfig.json
└── package.json
```

---

## File Descriptions

### `src/models/product.ts`
Defines the **Product** Mongoose schema and TypeScript interfaces.

Fields:
- `name` — Product name
- `store` — Store name (e.g. `"MyTek"`, `"Tunisianet"`, `"Scoop"`)
- `price` — Current price in DT
- `url` — Product page URL
- `image` — Product image URL
- `description` — Short description (optional)
- `lastUpdated` — Timestamp of last price update

---

### `src/models/priceHistory.ts`
Defines the **PriceHistory** schema. Every time a price changes, a new entry is recorded here.

Fields:
- `productId` — Reference to the `Product` document
- `price` — Price at the time of recording
- `date` — Timestamp of the price change

---

### `src/scraper/scrapeMyTek.ts`
Scrapes PC listings from [`mytek.tn`](https://www.mytek.tn) using **Playwright**.

- Iterates through 22 pages of search results
- Extracts: `name`, `price`, `url`, `image`, `description`
- Sets `store: "MyTek"` on each product
- Returns an array of product objects

---

### `src/scraper/scrapeTunisianet.ts`
Scrapes laptop listings from [`tunisianet.com.tn`](https://www.tunisianet.com.tn) using **Playwright**.

- Iterates through 34 pages sorted by price ascending
- Extracts: `name`, `price`, `url`, `image`
- Sets `store: "Tunisianet"` on each product
- Returns an array of product objects

---

### `src/scraper/scrapeScoop.ts`
Scrapes laptop and desktop listings from [`scoop.com.tn`](https://www.scoop.com.tn) using **Playwright**.

- Scrapes two separate category URLs (laptops + desktops)
- Uses **infinite scroll** detection — scrolls until no new items load
- Extracts: `name`, `price`, `url`, `image`, `description`
- Sets `store: "Scoop"` on each product
- Returns combined array of all products

---

### `src/updateProducts.ts`
Handles the **upsert logic** when saving a scraped product to MongoDB.

Logic:
1. Check if a product with the same `name` + `store` already exists
2. If **not found** → create new product + save initial price to `PriceHistory`
3. If **found** and price has **changed** → update the product price, `lastUpdated`, and add a new `PriceHistory` entry
4. If **found** and price is **unchanged** → do nothing

---

### `src/queue/worker.ts`
A **BullMQ Worker** that listens for scraping jobs on the `scrapeQueue`.

- Connects to Redis via `ioredis`
- Handles 3 job types: `scrape-mytek`, `scrape-tunisianet`, `scrape-scoop`
- On each job: calls the appropriate scraper, then calls `updateProduct()` for each result

---

### `src/scheduler/cron.ts`
Adds **recurring scrape jobs** to the BullMQ queue.

- All 3 stores are scheduled with cron pattern `0 */6 * * *` (every 6 hours)
- Jobs are deduplicated by BullMQ — safe to run multiple times

---

### `src/index.ts`
The **main entry point** of the application.

1. Connects to MongoDB Atlas
2. Dynamically imports the worker (starts listening for jobs)
3. Dynamically imports the scheduler (registers recurring jobs)

---

### `src/test.ts`
A **manual one-off script** for development/testing.

1. Clears all existing jobs from the queue
2. Adds fresh `scrape-mytek`, `scrape-tunisianet`, `scrape-scoop` jobs
3. Disconnects and exits

Run it with:
```bash
npx ts-node src/test.ts
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
```

---

## Running the App

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Start the scraper (connects MongoDB + starts worker + scheduler)
npm run start

# OR manually trigger jobs
npx tsx src/test.ts
```
