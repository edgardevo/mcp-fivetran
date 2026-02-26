# dgc-fivetran

A specialized Gemini CLI Extension for auditing and inspecting Fivetran accounts. This extension is **strictly read-only** and designed for security and compliance.

## Key Features

- **Read-Only**: Only `GET` endpoints are exposed. No state-changing operations are possible.
- **Security-First**:
  - **Recursive Redaction**: All outputs are scrubbed for sensitive keys (passwords, secrets, tokens).
- **Data Export**: Built-in tool to export data to CSV for offline analysis.
- **Pagination**: Automatic handling of Fivetran's cursor-based pagination.

## Setup

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd dgc-fivetran

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

1. Set your Fivetran API credentials as environment variables or in a `.env` file:
   ```env
   FIVETRAN_API_KEY=your_key
   FIVETRAN_API_SECRET=your_secret
   ```

## Usage

### Install in Gemini CLI

To install this extension in the Gemini CLI, run:

```bash
gemini extensions link .
```


## Tools

See [DOCS.md](DOCS.md) for a complete list of available tools.
