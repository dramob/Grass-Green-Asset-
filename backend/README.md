# Green Asset Backend

The backend service for the Green Asset platform, providing API endpoints for SDG claim verification using AI with web search capabilities.

## Features

- **SDG Claim Verification**: Evaluates sustainability claims by searching for evidence online
- **XRPL Integration**: Tokenization of green assets on the XRP Ledger
- **AI-Powered Analysis**: Uses OpenAI GPT models to analyze and condense web content

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js (for JavaScript parts)
- OpenAI API key

### Setup

1. Clone the repository
2. Create a virtual environment and install dependencies:

```bash
# Create a Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for any JavaScript components
cd js
npm install
```

3. Copy the environment file and add your OpenAI API key:

```bash
cp .env.example .env
# Edit the .env file to add your OPENAI_KEY
```

### Running the Server

```bash
# Start the Python FastAPI server
cd src
python main.py
```

## API Endpoints

- `POST /api/verification` - Verify SDG claims for a project
- `GET /api/verification/:id` - Get verification result by ID

## Development Notes

### SDG Claim Verification Process

1. The frontend collects company name, project details, and SDG claims
2. The backend receives these claims and constructs search queries
3. For each claim, we:
   - Search the web for evidence using the Google API
   - Scrape and analyze the content from search results
   - Use an LLM to condense and extract key information
   - Score the claim based on evidence found
4. Results are returned to the frontend for display

### Security Notes

- The `.env` file contains sensitive API keys and should not be committed to version control
- Web scraping should respect robots.txt and site policies
- Rate limiting is implemented to avoid overloading search and LLM APIs