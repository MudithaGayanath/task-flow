# TaskFlow — Next.js + Prisma 7 + MySQL

A small task manager built to walk through how Next.js and Prisma fit
together, and how to run it on Railway with a MySQL database.

> **Heads up about Prisma versions:** Prisma shipped a major breaking
> change in v7 (November 2025) — the database URL no longer lives in
> `schema.prisma`, and every database now needs a "driver adapter." This
> project is built for **Prisma 7.10.0**, matching what `npm install
> prisma` gives you today. If you're following an older tutorial that puts
> `url = env("DATABASE_URL")` inside `schema.prisma`, that's Prisma 6 and
> earlier — it will fail on 7 with error `P1012`.

## How this project is put together

### 1. Create the Next.js app

```bash
npx create-next-app@latest taskflow \
  --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*"
```

### 2. Add Prisma + the MySQL driver adapter

```bash
cd taskflow
npm install prisma --save-dev            # the CLI (dev-only tool)
npm install @prisma/client               # runtime library
npm install @prisma/adapter-mariadb mariadb   # MySQL driver adapter
npm install dotenv                       # Prisma 7 no longer auto-loads .env
```

Prisma 7 ships as an ES module, so `package.json` needs:

```json
{ "type": "module" }
```

### 3. Define the data model — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"      // the new Rust-free client
  output   = "../generated/prisma" // output is required in v7
}

datasource db {
  provider = "mysql"              // no `url` here anymore
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  notes     String?  @db.Text
  done      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 4. Configure the connection — `prisma.config.ts` (project root)

This file, not `schema.prisma`, is where the CLI (`generate`, `migrate`,
etc.) gets its database URL:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### 5. Set `DATABASE_URL` — `.env`

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

### 6. Instantiate the client with a driver adapter — `lib/prisma.ts`

```ts
import { PrismaClient } from "@/generated/prisma/client"; // note: not "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
export const prisma = new PrismaClient({ adapter });
```

Every Prisma 7 client needs a driver adapter — there's no default engine
baked in anymore. `PrismaMariaDb` covers MySQL too.

### 7. Generate the client and create the table

```bash
npx prisma generate                    # builds the typed client
npx prisma migrate dev --name init     # creates the Task table
```

Two v7 behavior changes to know:
- `migrate dev` **no longer runs `generate` automatically** — always run
  it yourself (this project's `postinstall` script does it after every
  `npm install`).
- The generated client lands in `./generated/prisma`, not
  `node_modules/@prisma/client` — that's why every import in this project
  uses `@/generated/prisma/client` instead of `@prisma/client`.

### 8. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Add a task, mark it done, delete it — each
action hits `app/api/tasks/route.ts` or `app/api/tasks/[id]/route.ts`,
which use `lib/prisma.ts` to talk to MySQL.

## Project structure

```
prisma.config.ts             Database URL + CLI settings (Prisma 7)
prisma/schema.prisma          Data model only — no connection string
generated/prisma/             Generated client (gitignored, rebuilt on install)
lib/prisma.ts                 Prisma Client instance, with the MySQL adapter
app/api/tasks/route.ts        GET (list) + POST (create)
app/api/tasks/[id]/route.ts   PATCH (toggle done) + DELETE
app/page.tsx                  Server Component — fetches tasks directly via Prisma
components/TaskBoard.tsx      Client Component — form + list, calls the API routes
```

## Deploying to Railway

1. **Push this project to a GitHub repo.**

2. **Create a new Railway project** → "Deploy from GitHub repo" → pick this
   repo.

3. **Add a MySQL database**: in the same Railway project, click
   **+ New → Database → Add MySQL**. Railway provisions it and exposes a
   `DATABASE_URL` variable on that database service.

4. **Connect the variable to your app service**: open your Next.js
   service → **Variables** → add `DATABASE_URL`, referencing the MySQL
   service's variable, e.g. `${{MySQL.DATABASE_URL}}`.

5. **Set the Build Command** to:

   ```
   npx prisma migrate deploy && npm run build
   ```

   (`npm install` already ran `prisma generate` via the `postinstall`
   script.) `migrate deploy` applies existing migrations without
   prompting — the right command for CI/production. It needs the
   migration files already committed in `prisma/migrations/`, so run
   `prisma migrate dev` locally at least once before your first deploy.

6. **Start Command** stays the default: `npm run start`.

7. Railway builds, migrates, and deploys. Your app goes live on the
   generated `*.up.railway.app` domain.

### Notes for Railway specifically

- Don't commit `.env` — `DATABASE_URL` should only exist as a Railway
  variable in production. It's already in `.gitignore`.
- `generated/prisma/` is also gitignored. It gets rebuilt automatically by
  the `postinstall` script on every `npm install`, including Railway's
  build.
- If you change `prisma/schema.prisma` later: run
  `npx prisma migrate dev --name <what_changed>` locally, commit the new
  migration folder, then redeploy.
