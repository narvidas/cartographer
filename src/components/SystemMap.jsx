import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

// Custom node types
const ServiceNode = ({ data }) => (
  <div
    className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${
      data.isSelected
        ? "border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/20"
        : "border-blue-200 hover:border-blue-400"
    }`}
    style={{ width: "200px", maxWidth: "200px" }}
    onClick={() => data.onClick && data.onClick()}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
    <div
      className="text-sm font-semibold text-foreground"
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={data.name}
    >
      {data.name}
    </div>
    <div className="text-xs text-blue-600 font-medium">Service</div>
    {data.description && (
      <div
        className="text-xs text-muted-foreground mt-1"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxHeight: "16px",
        }}
        title={data.description}
      >
        {data.description}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
  </div>
);

const DatabaseNode = ({ data }) => (
  <div
    className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${
      data.isSelected
        ? "border-green-500 shadow-green-500/20 ring-2 ring-green-500/20"
        : "border-green-200 hover:border-green-400"
    }`}
    style={{ width: "200px", maxWidth: "200px" }}
    onClick={() => data.onClick && data.onClick()}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500" />
    <div
      className="text-sm font-semibold text-foreground"
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={data.alias || data.name}
    >
      {data.alias || data.name}
    </div>
    <div className="text-xs text-green-600 font-medium">Database</div>
    <div
      className="text-xs text-muted-foreground mt-1"
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {data.database_type}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500" />
  </div>
);

const LambdaNode = ({ data }) => (
  <div
    className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${
      data.isSelected
        ? "border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500/20"
        : "border-purple-200 hover:border-purple-400"
    }`}
    style={{ width: "200px", maxWidth: "200px" }}
    onClick={() => data.onClick && data.onClick()}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500" />
    <div
      className="text-sm font-semibold text-foreground"
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={data.name}
    >
      {data.name}
    </div>
    <div className="text-xs text-purple-600 font-medium">Lambda</div>
    {data.description && (
      <div
        className="text-xs text-muted-foreground mt-1"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxHeight: "16px",
        }}
        title={data.description}
      >
        {data.description}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500" />
  </div>
);

const ContextNode = ({ data }) => (
  <div
    className="px-6 py-4 shadow-xl rounded-xl bg-gradient-to-br from-muted/50 to-muted border-2 border-border"
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
      zIndex: 1,
    }}
  >
    <div className="text-lg font-bold text-foreground mb-0.5">{data.name}</div>
    <div className="text-sm text-muted-foreground">{data.responsibility || "Context"}</div>
  </div>
);

const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  lambda: LambdaNode,
  context: ContextNode,
};

export default function InteractiveSystemMap({ data, onNodeClick, selectedEntity, searchResults }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowRef = useRef(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onInit = useCallback((reactFlowInstance) => {
    reactFlowRef.current = reactFlowInstance;
  }, []);

  // Helper function to check if a component matches search results
  const isComponentInSearchResults = (component) => {
    if (!searchResults || searchResults.length === 0) return true; // Show all when no search

    return searchResults.some(
      (result) =>
        result.name === component.name ||
        result.id === component.id ||
        (result.context && result.context === component.context),
    );
  };

  // Transform data into React Flow format
  useMemo(() => {
    if (!data) return;

    const flowNodes = [];
    const flowEdges = [];

    // Create service, lambda, and database nodes
    const allComponents = [
      ...(data.services || [])
        .filter((s) => s.type !== "lambda") // Filter out lambdas from services
        .map((s) => ({ ...s, type: "service" })),
      ...(data.services || []).filter((s) => s.type === "lambda").map((s) => ({ ...s, type: "lambda" })),
      ...(data.databases || []).map((db) => ({
        ...db,
        type: "database",
      })),
    ];

    // Group components by context
    const componentsByContext = {};
    allComponents.forEach((component) => {
      if (!component.context) return;
      if (!componentsByContext[component.context]) {
        componentsByContext[component.context] = [];
      }
      componentsByContext[component.context].push(component);
    });

    // Create context nodes as groups and position child nodes
    data.contexts.forEach((context, contextIndex) => {
      const contextComponents = componentsByContext[context.context] || [];

      // Check if this context contains any components that match search results
      const hasMatchingComponents = contextComponents.some((comp) => isComponentInSearchResults(comp));
      const isInSearchResults = !searchResults || searchResults.length === 0 || hasMatchingComponents;

      // Calculate context size based on number of components
      const componentCount = contextComponents.length;
      const rows = Math.ceil(componentCount / 3);
      const contextHeight = Math.max(300, 100 + rows * 120) + 60; // Added 60px bottom spacing

      // Calculate required width: 3 columns of 200px nodes + 2 gaps of 25px + 2 sides of 40px padding
      const contextWidth = 3 * 200 + 2 * 25 + 2 * 40; // = 650 + 50 + 80 = 780px

      // Create context group node
      const contextNode = {
        id: `context-${context.context}`,
        type: "context",
        position: { x: contextIndex * 850, y: 20 }, // Added 20px top spacing
        data: context,
        style: {
          width: contextWidth,
          height: contextHeight,
          opacity: isInSearchResults ? 1 : 0.3,
          transition: "opacity 0.3s ease-in-out",
        },
        // Make it a group node
        group: true,
        zIndex: 1,
        draggable: false,
        connectable: false,
      };

      flowNodes.push(contextNode);

      // Position child components within this context
      const contextX = contextNode.position.x;
      const contextY = contextNode.position.y;

      // Calculate grid layout for components within this context
      const cols = 3;
      const componentWidth = 200;
      const componentHeight = 100;
      const spacing = 25;
      const padding = 40;

      contextComponents.forEach((component, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Position components inside the context bounding box
        const nodeX = contextX + padding + col * (componentWidth + spacing);
        const nodeY = contextY + 80 + row * (componentHeight + spacing);

        // Check if this node is selected
        const isSelected =
          selectedEntity &&
          ((selectedEntity.id && selectedEntity.id === component.id) ||
            (selectedEntity.name && selectedEntity.name === component.name));

        // Check if this component matches search results
        const isInSearchResults = isComponentInSearchResults(component);

        const childNode = {
          id: `${component.type}-${component.id || component.name}`,
          type: component.type,
          position: { x: nodeX, y: nodeY },
          data: {
            ...component,
            onClick: () => onNodeClick(component),
            isSelected,
            isInSearchResults,
          },
          selected: isSelected,
          style: {
            opacity: isInSearchResults ? 1 : 0.3,
            transition: "opacity 0.3s ease-in-out",
            zIndex: 10, // Ensure child nodes are above context
          },
          // Make it a child of the context group
          parentNode: `context-${context.context}`,
          extent: "parent", // Constrain to parent bounds
        };

        flowNodes.push(childNode);
      });
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [data, setNodes, setEdges, onNodeClick, selectedEntity, searchResults]);

  // Center view on selected node
  useEffect(() => {
    if (selectedEntity && reactFlowRef.current) {
      const nodeId = `${selectedEntity.type || "service"}-${selectedEntity.id || selectedEntity.name}`;
      const node = reactFlowRef.current.getNode(nodeId);
      if (node) {
        reactFlowRef.current.setCenter(node.position.x, node.position.y, {
          duration: 800,
          zoom: 0.8,
        });
      }
    }
  }, [selectedEntity]);

  return (
    <div className="w-full h-full" style={{ width: "100%", height: "100%", minHeight: "500px" }}>
      <ReactFlow
        ref={reactFlowRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        attributionPosition="bottom-left"
        style={{ width: "100%", height: "100%" }}
        className="w-full h-full"
      >
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "context") return "#1e293b";
            if (n.type === "service") return "#3b82f6";
            if (n.type === "database") return "#10b981";
            if (n.type === "lambda") return "#8b5cf6";
            return "#1e293b";
          }}
          nodeColor={(n) => {
            if (n.type === "context") return "#f1f5f9";
            if (n.type === "service") return "#dbeafe";
            if (n.type === "database") return "#d1fae5";
            if (n.type === "lambda") return "#ede9fe";
            return "#f1f5f9";
          }}
        />
        <Background variant="dots" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
