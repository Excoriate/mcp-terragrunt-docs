FROM denoland/deno:alpine

WORKDIR /app

COPY . .

# Cache dependencies (optional, for larger projects with deps.ts)
# RUN deno cache deps.ts
RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
