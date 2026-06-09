FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/templates ./templates
COPY --from=build /app/package.json ./
RUN npm ci --production

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
