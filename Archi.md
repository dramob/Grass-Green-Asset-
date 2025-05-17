# Architecture Document

## Web Pages

### Sell Page
- Purpose: Submit a new green project/asset for validation and listing

#### Form Fields:
- Company Name 
- Project Name 
- SDG Goals Selection
  - 17 checkboxes corresponding to each SDG
  - Text fields to explain why each selected SDG applies

#### Submission Process:
1. User completes the form and clicks submit
2. System uses LLM with web search capability
3. Brave Search MCP is called to gather publicly available information about the company
4. Each SDG claim is scored based on the gathered information
5. Results are presented to user with validation scores

### Architectural Flow:
1. Frontend collects form data (React/TypeScript)
2. Data is submitted to backend service
3. Backend triggers LLM with web search
4. Scoring algorithm evaluates each claim
5. Results stored in database and displayed to user
