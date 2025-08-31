#!/bin/bash

echo "🚀 Starting System Architecture Map with Meilisearch..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Start Meilisearch
echo "🔍 Starting Meilisearch..."
docker-compose up -d

# Wait for Meilisearch to be ready
echo "⏳ Waiting for Meilisearch to be ready..."
sleep 5

# Setup search indexes
echo "📊 Setting up search indexes..."
yarn setup:search

# Start the development server for React SPA
echo "🌐 Starting development server..."
echo "✅ Setup complete! The application will be available at http://localhost:5173"
echo "🔍 Meilisearch is running at http://localhost:7700"
echo ""
echo "To stop the services, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
yarn start:ui 