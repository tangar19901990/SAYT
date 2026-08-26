# GT TIRES HUNTER

**AI FINDS. YOU PROFIT.**

Професійна AI-система пошуку вигідних вантажних шин по Україні. Це не інтернет-магазин — агент знаходить оголошення, оцінює їх і показує угоди з найбільшим потенційним прибутком.

## Що вміє MVP

- Dashboard з KPI, статусом агента і топ-угодами
- AI-пошук з фільтрами: розмір, бренд, стан, залишок, ціна, регіон, джерела
- Робочі результати: сортування, картки / таблиця, фільтри
- AI Score 0–100 з статусами ВІДМІННА / ВИГІДНО / ПЕРЕВІРИТИ / НЕВИГІДНО
- Deal Finder, база шин, аналітика, прибуток, збережені, налаштування
- Постачальники: 35 перевірених компаній (виробники, дистриб'ютори, опт, б/в склади, сервіси, маркетплейси) з live-перевіркою сайтів через `/api/suppliers` — мертві домени видалено після реальних HTTP-чеків
- Модальне вікно деталі шини і toast-сповіщення
- Адаптив: sidebar на desktop, згортання на tablet, bottom nav на mobile

## Стек

React · TypeScript · Vite · Tailwind CSS · Lucide · Recharts · Cloudflare Worker · D1

Каталог і пайплайн (save / stock / work) живуть у D1. Живі маркетплейси пробуються чесним fetch: якщо джерело 403/404 — пошук не падає, UI показує `sourceStatuses` і каталог seed.

Живі джерела пошуку (`POST /api/search` хантить усі одночасно): **Prom**, **Autoline**, **TyreClub** (tyreclub.com.ua, SSR-картки `/catalog/tyre/v-{id}-slug/`), **Atlantshina** (atlantshina.com.ua, склад `/item/{id}`). OLX і Truck1 блокують Worker — для них чесний статус + посилання на пошук. Кнопка «Відкрити»: якщо у картки є прямий URL саме цього оголошення — воно відкривається одразу; якщо ні — показується in-app перегляд з посиланням на пошук. На сторінці «Пошук» є панель **AI Genspark** — ШІ-аналіз живого хантингу (топ покупок, ризики, торг).

## API

- `GET /api/health`
- `GET /api/listings`
- `POST /api/search`
- `GET /api/listings/:id`
- `POST /api/listings/:id/save|stock|work`
- `GET /api/pipeline`
- `GET /api/kpi`
- `GET /api/agent`
- `POST /api/agent/start|stop`
- `GET /api/suppliers` (база постачальників + live-статус; `?fresh=1` — перевірити зараз, `?type=опт` — фільтр)
- `POST /api/ai/analyze` — AI Genspark аналізує живі оголошення розміру: топ-3 для купівлі, ризики, поради з торгу. Тіло: `{ "size": "315/80 R22.5", "listingIds": [...] }`. Використовує Genspark LLM proxy (`OPENAI_API_KEY`/`OPENAI_BASE_URL`, модель gpt-5-mini); без ключа — чесна локальна евристика

### Налаштування AI ключа

Покладіть ключ у `.dev.vars` в корені проєкту (файл у `.gitignore`, у git не потрапляє):

```
OPENAI_API_KEY=gsk-...
OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1
```

Локальний API (`scripts/local-api.mjs`) і `wrangler dev` читають цей файл автоматично. Для продакшен-деплою: `npx wrangler secret put OPENAI_API_KEY`.
- `GET|POST /api/settings`
- `POST /api/listings/:id/unsave|unstock|unwork`

Оголошення відкриваються in-app preview, не фейковими OLX/Prom URL.

## Запуск

```bash
npm install
npm run api
npm run dev
```

Збірка:

```bash
npm run build
npm run preview
```
