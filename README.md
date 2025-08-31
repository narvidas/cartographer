# Cartographer

## What

Imagine [Backstage](https://backstage.io/), but completely seamless and turn-key thanks to Agentic AI.

Carographer is an interactive system architecture discovery and cataloguing tool, that combines powerful visual mapping with full-text search capabilities. Cartographer helps teams understand, explore, and document their system architecture through both a rich visual interface and structured data format, whilst delegating the tedious interface definitions and mapping to a large-language models.

<div align="center">
  <img src="docs/preview.gif" alt="Cartographer Preview" width="420">
</div>

---

## Why

As enterprise architects and software engineering consultants, we sometimes find ourselves on an unfamiliar terrain, having to get up to speed quickly and learn years worth of architectural history in a matter of days. This is especially true within large microservice-heavy or legacy-ridden technical estates, where there's not one, but many communication channels to navigate (HTTP, gRPC, RabbitMQ, Kafka, etc.) and a lot of information to digest (endpoints, events, databases, documentation, etc.). In those cases, we need to quickly understand the architecture of the system, and document it in a way that is easy to understand and use.

I built this tool to help me seamlessly create maps of the systems when consulting on architectural questions or across many domains, by leveraging Agentic AI to scan Git repositories and generate a structured system map representation.

## Features

Cartographer provides both a powerful visualization interface and a structured data format for documenting system architectures:

### Discovery

- **Agentic AI**: Cartographer leverages Agentic AI to scan Git repositories and generate a structured system map representation.
- **Continuous Updates**: Cartographer can be configured to continuously update the system map as the architecture evolves, thanks to Git repository monitoring and webhooks.
- **Customizable**: Cartographer is customizable to fit your specific needs, with a flexible schema and extensible data model.

### Visual Interface

- **Interactive System Map**: Rich visual representation of services, contexts, and databases with clickable components
- **Entity Details Panel**: Deep dive into service details, endpoints, events, and relationships
- **Context-based Organization**: Group services by domain or team responsibility
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Search & Discovery

- **Powerful Full-text Search**: Search across all system components using Meilisearch
- **Real-time Results**: Instant search results with highlighting and relevance scoring
- **Multi-entity Search**: Find services, databases, endpoints, events, and documentation links
- **Keyboard Shortcuts**: Quick access with `Shift+Cmd+F` (Mac) or `Shift+Ctrl+F` (Windows/Linux)

### Data-Driven Architecture

- **Structured JSON Format**: Machine-readable system map in standardized format ([systems.json](public/systems.json))
- **Version Controlled**: Track architecture evolution alongside your code
- **Extensible Schema**: Easy to extend with custom fields and metadata
- **Separation of Concerns**: Data and visualization are decoupled for maximum flexibility

The core value lies in the structured data format - the React application is just one way to visualize and interact with your architecture data. You can build custom tools, generate documentation, or create reports using the same data source.

## Prerequisites

- Node.js (see [.nvmrc](.nvmrc))
- Docker and Docker Compose
- [Yarn](https://yarnpkg.com/)

## Setup Instructions

### One-liner (Quick Start)

```bash
yarn start
```

### Step-by-step

#### 1. Install Dependencies

```bash
yarn install
```

#### 2. Start Meilisearch

Start the Meilisearch service using Docker Compose:

```bash
docker-compose up -d
```

This will start Meilisearch on `http://localhost:7700`.

#### 3. Initialize Search Indexes

Run the setup script to populate Meilisearch with your system map data:

```bash
yarn setup:search
```

This script will:

- Create indexes for services, contexts, database servers, and external systems
- Index all data from `public/systems.json`
- Configure search settings for optimal results
- **Create a search-only API key** for secure frontend access

#### 4. Start the Development Server

```bash
yarn start:ui
```

The application will be available at `http://localhost:5173`.

## Usage

### Visual Interface

Once running, open your browser to `http://localhost:5173` to access the interactive system map. The interface provides:

- **System Map View**: Visual representation of your entire architecture with services, databases, and external systems
- **Entity Details Panel**: Click on any component to see detailed information including endpoints, events, documentation links, and relationships
- **Context Groupings**: Services are organized by domain/team contexts for better navigation
- **Responsive Layout**: Optimized for both desktop and mobile viewing

### Search & Discovery

Cartographer includes powerful search capabilities powered by Meilisearch:

- **Quick Search**: Use the search bar at the top or press `Shift+Cmd+F` (Mac) / `Shift+Ctrl+F` (Windows/Linux)
- **Real-time Results**: See instant results as you type with relevance scoring
- **Comprehensive Coverage**: Search across:
  - Service names, descriptions, and use cases
  - API endpoints and event names
  - Database names and types
  - Documentation links and repository URLs
  - Context names and responsibilities

### Data Management

The system map is stored in `public/systems.json` as structured data that you can:

- Edit directly to add new services or update existing ones
- Version control alongside your codebase
- Use as input for other tools and documentation generation
- Export or transform for reporting purposes

## Configuration

### Environment Variables

Below configuration is optional, but recommended for production. Create a `.env` file in the root directory:

```bash
MEILISEARCH_SEARCH_KEY=your_search_key_here # optional, defaults to change_this_in_production
MEILISEARCH_URL=http://localhost:7700 # optional, defaults to http://localhost:7700
```

### Meilisearch Settings

The Meilisearch instance is configured with:

- **Master Key**: `change_this_in_production` (change in production!)
- **Port**: 7700
- **Environment**: Development
- **Data Persistence**: Docker volume for data storage

### Adding New Data

To add new data to the search index:

1. Scan your Git repository. Refer to the [Instructions](src/discovery/Instructions.md) for a useful helper prompt to use with Cursor or Claude Code to be run against your Git repository.
2. Once you have the JSON, update `public/systems.json` with your new data.
3. Run the setup script again: `yarn setup:search`
4. Rinse and repeat for all systems/repositories you want to add to the system map.

## Code quality and conventions

### Pre-commit hooks

This project uses Husky to enforce code quality standards before commits. The following hooks are configured:

### Linting and formatting

This project uses ESLint and Prettier to enforce code quality standards.

### Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to enforce a consistent commit message format.

Commit messages must follow the conventional commit format:

```
type(scope): description
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Reverting previous commits

**Examples:**

```bash
git commit -m "feat: add new search functionality"
git commit -m "fix: resolve ESLint errors in App.tsx"
git commit -m "docs: update README with setup instructions"
```
