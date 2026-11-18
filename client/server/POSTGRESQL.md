# PostgreSQL reference

## Connection configuration

The server creates a `pg` connection pool in [`src/db.ts`](./src/db.ts). `dotenv` loads configuration from `server/.env`; provide these variables there:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=homeplanner
DB_PASSWORD=your-local-database-password
DB_NAME=home_planner
```

Use the port exposed by your local PostgreSQL service. In the current Docker setup, host port `5433` maps to PostgreSQL's container port `5432`. Keep the actual password private; `server/.env` is ignored by Git.

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | Hostname or IP address the server uses to reach PostgreSQL. |
| `DB_PORT` | PostgreSQL port exposed to the server; use the host-mapped port when running in Docker. |
| `DB_USER` | PostgreSQL login role used by the connection pool. |
| `DB_PASSWORD` | Password for `DB_USER`; set it in `.env`, but never commit or document its actual value. |
| `DB_NAME` | Database containing the `room_designs` table. |

## Startup and schema

Run the API from the `server` directory:

```sh
npm run dev
```

Before listening on port `5000`, [`src/app.ts`](./src/app.ts) connects to PostgreSQL and creates `room_designs` if it does not exist. The table stores each room design as JSONB with an automatically generated ID and creation timestamp. If database initialization fails, the API does not start.

## Design endpoints

- `GET /api/furniture` returns the furniture catalogue.
- `POST /api/design` validates and saves a room design.
- `GET /api/design` returns the most recently saved design, or `404` if none exists.

## Tests

Run the server tests with:

```sh
npm run test:run
```

The API tests use the configured PostgreSQL database for design saves and remove the rows they create. Run them only against a local or dedicated test database, not production.

## Troubleshooting

- `ECONNREFUSED`: confirm PostgreSQL is running and `DB_HOST`/`DB_PORT` match its exposed address.
- `password authentication failed`: update the local `DB_PASSWORD` to match the PostgreSQL role.
- `Failed to initialize PostgreSQL`: read the backend terminal error; the API waits for a successful database connection and schema setup before starting.
