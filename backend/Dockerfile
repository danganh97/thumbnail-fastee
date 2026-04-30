FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g sequelize-cli

COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/.sequelizerc ./.sequelizerc

EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
