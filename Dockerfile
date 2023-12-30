FROM node:20.10-slim

RUN npm install -g pnpm http-server

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

ARG PORT=8080
EXPOSE ${PORT}
ENV PORT=${PORT}

CMD ["bash", "-c", "http-server dist -p ${PORT}"]