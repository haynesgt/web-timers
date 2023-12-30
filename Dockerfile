FROM node:20.10-slim

RUN npm install -g pnpm http-server

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 8080

CMD ["http-server", "dist", "-p", "8080"]
