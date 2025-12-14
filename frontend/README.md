# ContextKeeper Frontend

The frontend for ContextKeeper is a modern React application built with TypeScript and Vite, providing an intuitive interface for querying your codebase's knowledge, visualizing relationships, and running AI agents.

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Bootstrap 5** - UI framework and styling
- **React Bootstrap** - Bootstrap components for React
- **React Force Graph** - 2D and 3D graph visualizations
- **Three.js** - 3D rendering for knowledge graph
- **React Markdown** - Markdown rendering for AI responses

## Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)
- Backend server running on `http://localhost:3000`

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Default repository (fallback if backend unavailable)
VITE_DEFAULT_REPOSITORY=owner/repo

# Default branch
VITE_DEFAULT_BRANCH=main
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── AIAgents.tsx             # AI agents dashboard
│   │   ├── AgentRunner.tsx          # Agent execution interface
│   │   ├── BranchSelector.tsx       # Branch selection dropdown
│   │   ├── DecisionPanel.tsx        # AI decision recommendations
│   │   ├── KnowledgeGraph.tsx       # 2D graph visualization
│   │   ├── KnowledgeGraph3D.tsx     # 3D graph visualization
│   │   ├── NotificationOverlay.tsx  # Update notifications
│   │   ├── RepositorySelector.tsx   # Repository selection
│   │   └── SyncStatus.tsx           # Data sync status & controls
│   ├── App.tsx               # Main application component
│   ├── App.css               # Application styles
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── .env                      # Environment variables
```

## Components

### App.tsx
Main application component with tab-based navigation.

**Features:**
- Tab navigation (Query, Knowledge Graph, AI Agents, Sync Status)
- Repository and branch selection
- Global state management
- Update notifications

**Tabs:**
1. **Query** - Ask questions about your codebase
2. **Knowledge Graph** - Visualize relationships (2D/3D)
3. **AI Agents** - Run and view AI agent analyses
4. **Sync Status** - Manage data synchronization

### QueryInterface Component
Natural language query interface for asking questions about the codebase.

**Features:**
- Text input for questions
- AI-generated answers with markdown rendering
- Source attribution (commits, files, authors)
- Related people and timeline display
- Loading states and error handling

**Example Questions:**
- "Why did we choose MongoDB?"
- "Who worked on authentication?"
- "What are the recent changes to the API?"

### KnowledgeGraph.tsx (2D)
Interactive 2D force-directed graph visualization.

**Features:**
- Node types: commits, authors, files, technologies, decisions
- Link types: authored, modified, uses, decided
- Interactive zoom and pan
- Node click for details
- Color-coded by node type
- Dynamic force simulation

**Node Colors:**
- Commits: Blue
- Authors: Green
- Files: Orange
- Technologies: Purple
- Decisions: Red

### KnowledgeGraph3D.tsx
Immersive 3D force-directed graph visualization.

**Features:**
- 3D rendering with Three.js
- Camera controls (rotate, zoom, pan)
- Hover tooltips
- Click interactions
- Particle effects
- Depth perception with lighting

**Controls:**
- Left click + drag: Rotate
- Right click + drag: Pan
- Scroll: Zoom
- Click node: View details

### AIAgents.tsx
Dashboard for viewing AI agent summaries and analyses.

**Features:**
- Date range filters (24h, 7d, 30d, month, year, all-time)
- Agent-specific summaries (GitHub, Slack, Notion)
- Unified AI summary
- Decision engine recommendations
- Markdown rendering for formatted output
- Professional data presentation

**Agent Types:**
- **GitHub Agent**: Commit and PR analysis
- **Slack Agent**: Conversation insights
- **Notion Agent**: Documentation updates
- **Unified Summary**: Cross-source analysis
- **Decision Engine**: AI recommendations

### AgentRunner.tsx
Interface for running AI agents and viewing real-time results.

**Features:**
- Agent selection (GitHub, Slack, Notion, Summarize, Decide)
- Time period configuration
- Real-time job status polling
- Progress indicators
- Result display with markdown
- Error handling

**Workflow:**
1. Select agent type
2. Configure time period (hours)
3. Click "Run Agent"
4. Monitor progress
5. View results

### BranchSelector.tsx
Dropdown for selecting Git branches.

**Features:**
- Lists all available branches
- Shows current selection
- Triggers data refresh on change
- Loading states
- Error handling

### RepositorySelector.tsx
Dropdown for selecting repositories.

**Features:**
- Repository selection
- Default repository from config
- Triggers data refresh on change
- Integration with backend config

### SyncStatus.tsx
Data synchronization management interface.

**Features:**
- ChromaDB status display (document count)
- MongoDB connection status
- Sync all branches button
- Sync current branch button
- Update notifications
- Real-time status updates
- Progress indicators

**Actions:**
- **Sync All Branches**: Collect data from all repository branches
- **Sync Current Branch**: Update data for selected branch only
- **Check Updates**: Detect new commits available

### DecisionPanel.tsx
Displays AI-powered decision recommendations.

**Features:**
- Priority classification (Critical, High, Medium, Low)
- Actionable recommendations
- Blocker identification
- Trend analysis
- Color-coded priorities

### NotificationOverlay.tsx
Overlay for displaying update notifications.

**Features:**
- Update availability alerts
- Accept/dismiss actions
- Auto-hide after timeout
- Animated transitions

## API Integration

The frontend communicates with the backend via REST API calls using the `fetch` API.

### API Helper Function

```typescript
const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}${endpoint}`, options);
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  return response.json();
};
```

### Common API Calls

**Query:**
```typescript
const result = await apiFetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Why did we choose React?',
    repository: 'owner/repo',
    branch: 'main'
  })
});
```

**Knowledge Graph:**
```typescript
const graph = await apiFetch(
  `/api/knowledge-graph?repository=${repo}&branch=${branch}`
);
```

**Sync Data:**
```typescript
const result = await apiFetch('/api/sync-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ repository: 'owner/repo', branch: 'main' })
});
```

**Run Agent:**
```typescript
const job = await apiFetch('/api/agents/github', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repository: 'owner/repo',
    branch: 'main',
    hours: 24
  })
});
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:3000` |
| `VITE_DEFAULT_REPOSITORY` | No | Fallback repository | - |
| `VITE_DEFAULT_BRANCH` | No | Fallback branch | `main` |

**Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

## Development Workflow

### Running Development Server

```bash
npm run dev
```

Features:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- TypeScript type checking
- Auto-reload on file changes

### Building for Production

```bash
npm run build
```

This creates an optimized production build in `dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### Type Checking

TypeScript type checking happens automatically during development and build.

## Styling

The application uses **Bootstrap 5** for styling with custom CSS for specific components.

### Bootstrap Components Used
- Navbar
- Tabs
- Cards
- Buttons
- Forms
- Badges
- Spinners
- Alerts

### Custom Styles
- `App.css` - Application-wide styles
- `NotificationOverlay.css` - Notification animations
- Component-specific inline styles

## State Management

The application uses React's built-in state management:
- `useState` for component state
- `useEffect` for side effects and data fetching
- Props for parent-child communication
- No external state management library (Redux, MobX) needed

## TypeScript Configuration

### tsconfig.json
Main TypeScript configuration for the application.

### tsconfig.app.json
Application-specific TypeScript settings.

### tsconfig.node.json
Node.js-specific TypeScript settings for Vite config.

## Troubleshooting

### "Failed to fetch" errors
**Problem**: Cannot connect to backend API.

**Solution:**
1. Ensure backend is running on `http://localhost:3000`
2. Check `VITE_API_URL` in `.env`
3. Verify CORS is enabled on backend

### Knowledge Graph not displaying
**Problem**: Graph shows "No data available".

**Solution:**
1. Sync repository data first (Sync Status tab)
2. Wait for sync to complete
3. Refresh the Knowledge Graph tab

### TypeScript errors
**Problem**: Type errors during development.

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build errors
**Problem**: Production build fails.

**Solution:**
1. Fix all TypeScript errors first
2. Check for missing dependencies
3. Ensure all imports are correct

### Hot reload not working
**Problem**: Changes don't reflect in browser.

**Solution:**
1. Restart dev server
2. Clear browser cache
3. Check for syntax errors in console

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Note:** 3D Knowledge Graph requires WebGL support.

## Performance Optimization

- **Code splitting**: Vite automatically splits code by route
- **Lazy loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: API calls debounced to reduce requests

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder via Netlify UI or CLI
```

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

## Contributing

When adding new components:
1. Create component in `src/components/`
2. Use TypeScript for type safety
3. Follow existing naming conventions
4. Add proper error handling
5. Update this README

## Dependencies

### Production Dependencies
- `react` - UI library
- `react-dom` - React DOM rendering
- `bootstrap` - CSS framework
- `react-bootstrap` - Bootstrap React components
- `react-force-graph-2d` - 2D graph visualization
- `react-force-graph-3d` - 3D graph visualization
- `react-markdown` - Markdown rendering
- `three` - 3D graphics library
- `three-spritetext` - 3D text rendering

### Development Dependencies
- `@vitejs/plugin-react-swc` - Vite React plugin with SWC
- `typescript` - TypeScript compiler
- `eslint` - Code linting
- `@types/*` - TypeScript type definitions

## License

Apache 2.0 - See [LICENSE](../LICENSE) for details.
