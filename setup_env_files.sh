#!/bin/bash

# Create frontend .env.example
cat > /workspaces/Grass-Green-Asset-/frontend/.env.example << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:3000/api

# XRPL Configuration
VITE_XRPL_NETWORK=testnet

# Feature Flags
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEEP_VERIFICATION=false
EOF

echo "Frontend .env.example created"

# Create backend .env.example
cat > /workspaces/Grass-Green-Asset-/backend/.env.example << 'EOF'
# XRPL Connection
XRPL_NETWORK=testnet

# OpenAI API Key - Required for AI certification features
OPENAI_KEY=your_openai_key_here

# Web Search Configuration
MAX_SEARCH_RESULTS=10
MAX_PAGE_DEPTH=2

# Server Configuration
PORT=3000
NODE_ENV=development
EOF

echo "Backend .env.example created"

# Update .gitignore to exclude .env files
if ! grep -q "^.env$" /workspaces/Grass-Green-Asset-/.gitignore; then
    echo ".env" >> /workspaces/Grass-Green-Asset-/.gitignore
    echo ".env.*" >> /workspaces/Grass-Green-Asset-/.gitignore
    echo "!.env.example" >> /workspaces/Grass-Green-Asset-/.gitignore
    echo ".env files added to .gitignore"
fi

echo "Environment setup completed"