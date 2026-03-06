#!/bin/sh

echo "🎭 Starting Theater Plan Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "✅ Redis is ready"

# Run database migration
echo "📊 Running database migration..."
npm run db:migrate

# Start the server
echo "🚀 Starting server..."
npm run start
