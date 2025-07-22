#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'module';

// Redirect console.log to stderr to prevent JSON-RPC pollution
const originalLog = console.log;
console.log = (...args) => {
  console.error(...args);
};

const require = createRequire(import.meta.url);
const bundle = require('./nova-memory-bundle.js');

const server = new Server(
  { name: 'nova-memory', version: '0.1.2' },
  { capabilities: { tools: {} } }
);

// Extract all necessary classes from bundle
const { 
  EnhancedMemorySystem, 
  EnhancedMCPTools,
  ConflictDetectionEngine,
  VisualMemoryMapper,
  CrossReferenceValidator,
  BoardStatusTool,
  WorkflowTools,
  MetaTools 
} = bundle;

// Initialize components
const memorySystem = new EnhancedMemorySystem();
const enhancedTools = new EnhancedMCPTools(memorySystem);
const boardTool = new BoardStatusTool(memorySystem);
const workflowTool = new WorkflowTools(memorySystem);
const conflictEngine = new ConflictDetectionEngine(memorySystem);
const visualMapper = new VisualMemoryMapper(memorySystem);
const crossValidator = new CrossReferenceValidator(memorySystem);

// Create meta tools with all dependencies
const metaTools = new MetaTools(
  memorySystem, 
  enhancedTools, 
  boardTool, 
  workflowTool,
  conflictEngine,
  visualMapper,
  crossValidator
);

// Meta-tools interface
const META_TOOLS = [
  {
    name: "memory",
    description: "🧠 Unified memory operations - store, query, search, export, stats",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["store", "query", "search", "export", "stats"],
          description: "Action to perform"
        },
        content: { 
          type: "string", 
          description: "Content to store (required for 'store' action)" 
        },
        query: { 
          type: "string", 
          description: "Search/query string (required for 'query' and 'search' actions)" 
        },
        memory_type: { 
          type: "string", 
          enum: ["observation", "action", "result", "error", "context", "general"],
          description: "Type of memory entry"
        },
        tags: { 
          type: "array", 
          items: { type: "string" },
          description: "Tags for categorization"
        },
        limit: { 
          type: "integer", 
          default: 20,
          description: "Maximum results to return"
        },
        format: { 
          type: "string", 
          enum: ["json", "csv", "markdown"],
          description: "Export format (for 'export' action)"
        },
        detailed: {
          type: "boolean",
          description: "Include detailed statistics (for 'stats' action)"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "workflow",
    description: "📋 Manage enhancements, phases, and workflow state",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["create", "complete", "status", "phases", "connection", "short_memory"],
          description: "Action to perform"
        },
        title: { 
          type: "string",
          description: "Enhancement title (required for 'create' action)"
        },
        description: { 
          type: "string",
          description: "Enhancement description"
        },
        type: { 
          type: "string", 
          enum: ["ui", "api", "optimization", "feature"],
          description: "Enhancement type"
        },
        priority: { 
          type: "string", 
          enum: ["high", "medium", "low"],
          description: "Priority level"
        },
        phase: { 
          type: "string",
          description: "Phase name (required for 'complete' action)"
        },
        value: { 
          type: "string",
          description: "Connection string or command (required for 'connection' action)"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "board",
    description: "📊 Task board management with categories and priorities",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["status", "create", "update", "move", "delete"],
          description: "Action to perform"
        },
        title: { 
          type: "string",
          description: "Task title (required for 'create' action)"
        },
        description: { 
          type: "string",
          description: "Task description"
        },
        category: { 
          type: "string",
          enum: ["journal-reminder", "active-memory", "killer-features", "pending-tasks", "completed"],
          description: "Task category (required for 'create' action)"
        },
        priority: { 
          type: "string", 
          enum: ["high", "medium", "low"],
          description: "Task priority"
        },
        tags: { 
          type: "array", 
          items: { type: "string" },
          description: "Task tags"
        },
        task_id: { 
          type: "string",
          description: "Task ID (required for 'update', 'move', 'delete' actions)"
        },
        format: {
          type: "string",
          enum: ["simple", "detailed", "task_ids"],
          description: "Output format for status"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "relationships",
    description: "🔗 Manage entity relationships and knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["store", "query", "traverse"],
          description: "Action to perform"
        },
        entity1: { 
          type: "string",
          description: "First entity (required for 'store' action)"
        },
        relation: { 
          type: "string",
          description: "Relationship type (required for 'store' action)"
        },
        entity2: { 
          type: "string",
          description: "Second entity (required for 'store' action)"
        },
        start_entity: { 
          type: "string",
          description: "Starting entity (required for 'traverse' action)"
        },
        max_hops: { 
          type: "integer", 
          default: 3,
          description: "Maximum relationship hops"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "analysis",
    description: "📈 Analyze and visualize memory data patterns",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["analyze", "conflicts", "visualize", "validate"],
          description: "Action to perform"
        },
        algorithm: { 
          type: "string",
          enum: ["clustering", "pagerank", "community", "hybrid"],
          description: "Analysis algorithm"
        },
        format: { 
          type: "string",
          enum: ["ascii_graph", "mermaid", "dot_graph", "json_tree"],
          description: "Visualization format"
        },
        days: {
          type: "integer",
          description: "Analyze memories from last N days"
        },
        category: {
          type: "string",
          description: "Filter by memory category"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "project",
    description: "📁 Project management and file tracking",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["list", "switch", "changes"],
          description: "Action to perform"
        },
        project_path: { 
          type: "string",
          description: "Path to project directory (required for 'switch' action)"
        },
        detailed: {
          type: "boolean",
          description: "Include project statistics"
        },
        limit: {
          type: "integer",
          description: "Maximum changes to show"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "settings",
    description: "⚙️ Configure Nova Memory preferences",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["categories", "algorithms", "set_algorithm", "cleanup"],
          description: "Action to perform"
        },
        algorithm: { 
          type: "string",
          enum: ["tfidf", "bm25", "hybrid"],
          description: "Search algorithm to set (required for 'set_algorithm' action)"
        },
        force: {
          type: "boolean",
          description: "Force cleanup even if not due"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "quick",
    description: "⚡ Shortcuts for common operations",
    inputSchema: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["save", "find", "task", "note", "status"],
          description: "Action to perform"
        },
        content: { 
          type: "string",
          description: "Content to save (required for 'save' action)"
        },
        query: { 
          type: "string",
          description: "Search query (required for 'find' action)"
        },
        title: { 
          type: "string",
          description: "Task/note title (required for 'task' and 'note' actions)"
        },
        description: {
          type: "string",
          description: "Note content (required for 'note' action)"
        },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Task priority"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Quick tags"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "help",
    description: "❓ Interactive help and documentation",
    inputSchema: {
      type: "object",
      properties: {
        topic: { 
          type: "string", 
          enum: ["overview", "memory", "workflow", "board", "relationships", "analysis", "project", "settings", "quick"],
          description: "Help topic to show"
        }
      }
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: META_TOOLS
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Execute through meta tools
    if (metaTools[name]) {
      const result = await metaTools[name](args);
      return {
        content: [{
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }]
      };
    }
    
    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error: ${error.message}`
      }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
