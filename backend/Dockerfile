FROM node:20-alpine

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
