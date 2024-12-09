FROM oven/bun:latest

LABEL author="N0tAbuzer"

WORKDIR /app

COPY . /app/

RUN bun install

ENV FORCE_COLOR=1

CMD [ "bun", "run", "index.ts" ]