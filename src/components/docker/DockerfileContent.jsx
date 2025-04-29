export default function DockerfileContent() {
  const content = `FROM node:18-alpine AS base

# הגדרות בסיס
FROM base AS deps
WORKDIR /app

# התקנת dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# בניית האפליקציה
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# בנייה לייצור
RUN npm run build

# הגדרת סביבת הרצה
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# העתקת קבצי הרצה בלבד
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# הגדרת משתמש לא-רוט להרצה
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
RUN chown -R appuser:nodejs /app
USER appuser

# חשיפת פורט
EXPOSE 3000

# הרצת האפליקציה
CMD ["npm", "start"]`;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}