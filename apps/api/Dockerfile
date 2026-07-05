FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=@swiggyzone/shared
RUN npm run build --workspace=@swiggyzone/api

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
CMD ["npm", "run", "start:prod", "--workspace=@swiggyzone/api"]
