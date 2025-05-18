# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a decentralized marketplace for green assets built on the XRP Ledger (XRPL). The platform allows companies to tokenize and sell environmental projects while providing transparent verification of sustainability claims using AI with web search capabilities. The platform analyzes publicly available information to verify Sustainable Development Goals (SDG) claims made by companies.

The codebase is structured with:
- React/TypeScript frontend using Vite as the build tool
- Python/FastAPI backend for verification services with Node.js components

## Project Structure

The project is organized into two main directories:

### Frontend (`/frontend`)
- `/public` - Static assets and wallet icons
- `/src` - Source code
  - `/components` - Reusable React components
    - `/layout` - Layout components (Header, Footer, Sidebar)
    - `/ui` - UI components (Buttons, Cards, Modals)
  - `/pages` - Page components corresponding to routes
  - `/store` - State management with Zustand
  - `/services` - Services for XRPL integration and wallet connections
  - `/locales` - Internationalization files (en.json, fr.json)

### Backend (`/backend`)
- `/src` - Source code
  - `/controllers` - Request handlers including LLM certification
  - `/models` - Data models including project schema
  - `/services` - Service modules
    - `/api` - API service interfaces
    - `/llm` - OpenAI integration
    - `/search` - Web search integration
    - `/storage` - Data storage services
    - `/verification` - Verification logic
    - `/xrpl` - XRPL tokenization services

## Commands

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Set up Python environment
python setup.py

# Start the backend server
.venv/bin/python src/main.py

# Start Node.js components (if needed)
npm start

# Run tests
.venv/bin/python -m pytest
```

## Environment Setup

The project uses environment variables for configuration. Example configurations are provided in `.env.example` files.

### Frontend Environment Variables

```
# API Configuration
VITE_API_URL=http://localhost:3000/api

# XRPL Configuration
VITE_XRPL_NETWORK=testnet

# Feature Flags
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEEP_VERIFICATION=false
```

### Backend Environment Variables

```
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
```

## Key Technologies

- **Frontend**
  - React - UI library
  - TypeScript - Static typing
  - Vite - Build tool
  - Zustand - State management
  - React Router - Routing
  - i18next - Internationalization
  - Tailwind CSS - Utility-first CSS framework

- **Backend**
  - Python/FastAPI - API framework
  - OpenAI - LLM integration for verification
  - Express.js - Node.js components
  - XRPL SDK - XRP Ledger integration

## Authentication System

The application uses XRPL wallet-based authentication with support for multiple wallet providers:
- XUMM/Xaman
- GemWallet
- Crossmark
- Google OAuth (which creates an XRPL wallet for the user)

Authentication state is managed through `useAuthStore.ts` which handles:
- Wallet connection and disconnection
- User session management
- Balance fetching
- Wallet validation

## XRPL Integration

XRPL integration is handled through the XrplService class which:
- Manages connections to XRPL networks (mainnet, testnet, devnet)
- Provides fallback mechanisms for network endpoints
- Fetches account information and balances
- Creates test wallets for development
- Validates XRPL addresses

## Project Submission and SDG Verification

The core functionality of the application includes:

1. **Form Submission** - Companies submit their project details along with SDG claims
   - Project name and company details
   - Selection of relevant SDGs (17 options)
   - Justification for each selected SDG

2. **AI Verification Process**
   - The backend uses OpenAI's GPT models with web search capability
   - Brave Search API is used to gather publicly available information
   - Each SDG claim is scored based on web evidence
   - Results include confidence level, evidence summary, and sources

3. **Tokenization**
   - Verified projects can be tokenized on the XRP Ledger
   - Creates digital assets representing green initiatives

## Development Modes

The platform supports two primary modes:

1. **Mock Mode** (`VITE_ENABLE_MOCK_DATA=true`)
   - Uses mock data for verification
   - Doesn't require API keys
   - Suitable for frontend development

2. **Full API Mode** (`VITE_ENABLE_MOCK_DATA=false`)
   - Connects to the Python backend
   - Requires OpenAI API key and Brave Search API key
   - Provides real verification of SDG claims

## Development Notes

- The frontend includes a fallback mechanism for XRPL connections, trying alternative endpoints if the primary fails
- In development mode, mock balances are used for XRPL wallets to improve the user experience
- The LLM certification controller uses a staged approach:
  1. Initial query to gather information
  2. Web search to collect evidence
  3. Final analysis to score SDG claims