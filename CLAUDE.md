# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a decentralized marketplace for green assets built on the XRP Ledger (XRPL). The codebase is structured with a React/TypeScript frontend using Vite as the build tool. The application allows users to buy, sell, and manage tokenized green assets, with authentication using XRPL wallets.

## Project Structure

The project is organized into a frontend directory with the following structure:
- `/frontend` - Contains the entire React/TypeScript application
  - `/public` - Static assets and wallet icons
  - `/src` - Source code
    - `/components` - Reusable React components
      - `/layout` - Layout components (Header, Footer, Sidebar, etc.)
      - `/ui` - UI components (Buttons, Cards, Modals, etc.)
    - `/pages` - Page components corresponding to routes
    - `/store` - State management with Zustand
    - `/services` - Services for XRPL integration and wallet connections
    - `/locales` - Internationalization files (en.json, fr.json)

## Commands

### Development

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

## Key Technologies

- **React** - Frontend UI library
- **TypeScript** - Static typing
- **Vite** - Build tool and development server
- **Zustand** - State management
- **React Router** - Routing
- **i18next** - Internationalization
- **XRPL** - XRP Ledger integration
- **Tailwind CSS** - Utility-first CSS framework

## Authentication System

The application uses XRPL wallet-based authentication with support for multiple wallet providers:
- XUMM
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
- Fetches account information and balances
- Creates test wallets for development
- Validates XRPL addresses

## Project Submission and SDG Scoring

The application includes functionality for listing new assets through a form that:
- Collects project name and company details
- Allows selection of SDG (Sustainable Development Goals) that the project supports
  - Includes 17 checkboxes corresponding to each SDG
  - Provides fields to explain why each selected SDG applies to the project
- When submitted, uses an LLM with web search capabilities
  - Integrates with Brave Search MCP to gather publicly available information about the company
  - Automatically scores each SDG claim based on this information
  - Provides objective validation of sustainability claims

## Main Features

- User authentication with XRPL wallets
- Asset browsing and filtering
- Asset details view
- Buying and selling green assets
- User profile management
- Project listing and scoring

## Internationalization

The application supports multiple languages with i18next:
- English (en.json)
- French (fr.json)