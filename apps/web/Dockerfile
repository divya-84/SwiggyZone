FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build --workspace=@swiggyzone/shared
RUN npm run build --workspace=@swiggyzone/ui
RUN npm run build --workspace=@swiggyzone/web

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@swiggyzone/web"]
