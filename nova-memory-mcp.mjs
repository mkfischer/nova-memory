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
  { name: 'nova-memory', version: '0.1.8-beta' },
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
          enum: ["create", "complete", "status", "phases", "connection"],
          description: "Action to perform"
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
