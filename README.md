# Green Asset Platform

A decentralized marketplace for green assets built on the XRP Ledger (XRPL) with AI-powered verification of SDG claims.

## Project Overview

The Green Asset Platform allows companies to tokenize and sell environmental projects while providing transparent verification of sustainability claims using AI with web search capabilities. The platform analyzes publicly available information to verify Sustainable Development Goals (SDG) claims made by companies.

## Key Features

- **XRPL Wallet Authentication**: Connect with multiple wallet providers (XUMM, GemWallet, Crossmark)
- **SDG Claim Submission**: Companies select relevant SDGs and explain their contributions
- **AI-Powered Verification**: Uses OpenAI's GPT models with web search to verify sustainability claims
- **Objective Scoring**: Provides transparent verification of environmental impact claims
- **Tokenization**: Creates digital assets on the XRP Ledger

## Repository Structure

- `/frontend`: React/TypeScript application
- `/backend`: Python FastAPI application for verification services

## Getting Started

### Quickstart with Mock Data

The easiest way to run the application is using mock data (without requiring API keys):

1. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. The frontend will run in mock mode (VITE_ENABLE_MOCK_DATA=true in .env)

### Full Setup with AI Verification

To enable real SDG verification with AI:

1. Get an OpenAI API key from [OpenAI](https://platform.openai.com)

2. Set up the backend:
   ```bash
   cd backend
   
   # Edit .env to add your OpenAI key
   echo "OPENAI_KEY=your_actual_key_here" >> .env
   
   # Set up the Python environment
   python setup.py
   
   # Start the backend server
   .venv/bin/python src/main.py
   ```

3. Start the frontend with real API integration:
   ```bash
   cd frontend
   
   # Edit .env to disable mock mode
   echo "VITE_ENABLE_MOCK_DATA=false" > .env
   
   npm run dev
   ```

## Using the Platform

1. **Connect your XRPL wallet** using one of the supported providers
2. **Navigate to the Sell page** to create a new listing
3. **Fill in your project details** and select SDGs that apply
4. **Submit for verification** to have your claims checked using AI
5. **Review the verification results** with detailed evidence and scoring
6. **Mint your verified asset** on the XRP Ledger

## Development Notes

### Environment Variables

#### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000/api)
- `VITE_ENABLE_MOCK_DATA`: Use mock data instead of real API (default: true)
- `VITE_XRPL_NETWORK`: XRPL network to use (default: testnet)

#### Backend (.env)
- `OPENAI_KEY`: OpenAI API key for verification services
- `PORT`: Port for the API server (default: 3000)
- `XRPL_NETWORK`: XRPL network for tokenization (default: testnet)

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
.venv/bin/python -m pytest
```