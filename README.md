# dgc-fivetran

A specialized Gemini CLI Extension for auditing and inspecting Fivetran accounts and Fivetran Activations (Census) reverse-ELT pipelines. This extension is **strictly read-only** for operational tools and designed for security and compliance.

## Key Features

- **Read-Only Operations**: All tools used for auditing are restricted to `GET` endpoints.
- **Support for Fivetran Activations (Census)**: Full set of tools to audit reverse-ELT syncs, sources, and destinations.
- **Security-First**:
  - **Recursive Redaction**: All outputs are scrubbed for sensitive keys (passwords, secrets, tokens).
- **Data Export**: Built-in tool to export data to CSV for offline analysis.
- **Pagination**: Automatic handling of cursor-based pagination for both Fivetran and Activations APIs.

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

1. Set your API credentials in a `.env` file:
   ```env
   # Standard Fivetran ELT
   FIVETRAN_API_KEY=your_key
   FIVETRAN_API_SECRET=your_secret

   # Fivetran Activations (Census)
   CENSUS_API_KEY=your_census_key
   ```

## Usage

### Install in Gemini CLI

To install this extension in the Gemini CLI, run:

```bash
gemini extensions link .
```


## Tools

See [DOCS.md](DOCS.md) for a complete list of available tools.
