import React, { useState } from "react";

interface EntityDetailsPanelProps {
  selectedEntity: any | null;
  onClose: () => void;
}

export default function EntityDetailsPanel({
  selectedEntity,
  onClose,
}: EntityDetailsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<{
    endpoints: boolean;
    eventsPublished: boolean;
    eventsConsumed: boolean;
  }>({
    endpoints: false,
    eventsPublished: false,
    eventsConsumed: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!selectedEntity) {
    return null;
  }

  const getEntityType = (entity: any) => {
    if (entity.type === "lambda") return "Lambda Function";
    if (entity.type === "database") return "Database Server";
    if (entity.type === "service") return "Service";
    return "";
  };

  const getEntityIcon = (entity: any) => {
    if (entity.type === "lambda") return "λ";
    if (entity.type === "database") return "🗄️";
    if (entity.type === "service") return "💻";
    return "📋";
  };

  return (
    <div className="fixed top-0 right-0 w-[420px] h-full bg-card border-l border-border shadow-xl overflow-y-auto z-50 details-panel-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getEntityIcon(selectedEntity)}</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {selectedEntity.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getEntityType(selectedEntity)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        {selectedEntity.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Description
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedEntity.description}
            </p>
          </div>
        )}

        {/* Repository URL */}
        {selectedEntity.repoUrl && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Repository
            </h3>
            <a
              href={selectedEntity.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm break-all underline"
            >
              {selectedEntity.repoUrl}
            </a>
          </div>
        )}

        {/* Context */}
        {selectedEntity.context && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Context
            </h3>
            <span className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
              {selectedEntity.context}
            </span>
          </div>
        )}

        {/* Database Type */}
        {selectedEntity.database_type && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Database Type
            </h3>
            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              {selectedEntity.database_type}
            </span>
          </div>
        )}

        {/* Database Access Level */}
        {selectedEntity.access && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Access Level
            </h3>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                selectedEntity.access === "write"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {selectedEntity.access === "write" ? "Read/Write" : "Read Only"}
            </span>
          </div>
        )}

        {/* Database Environment */}
        {selectedEntity.environment && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Environment
            </h3>
            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
              {selectedEntity.environment}
            </span>
          </div>
        )}

        {/* Database Endpoint */}
        {selectedEntity.endpoint_url && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Endpoint URL
            </h3>
            <div className="bg-muted px-3 py-2 rounded text-sm font-mono text-foreground break-all">
              {selectedEntity.endpoint_url}
            </div>
          </div>
        )}

        {/* Database Server */}
        {selectedEntity.database_server && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Database Server
            </h3>
            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
              {selectedEntity.database_server}
            </span>
          </div>
        )}

        {/* Endpoints */}
        {selectedEntity.endpoints && selectedEntity.endpoints.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                Endpoints ({selectedEntity.endpoints.length})
              </h3>
              {selectedEntity.endpoints.length > 10 && (
                <button
                  onClick={() => toggleSection("endpoints")}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {expandedSections.endpoints ? "Show Less" : "Show All"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {selectedEntity.endpoints
                .slice(0, expandedSections.endpoints ? undefined : 10)
                .map((endpoint: string, index: number) => (
                  <div
                    key={index}
                    className="bg-muted px-3 py-2 rounded text-sm font-mono text-foreground overflow-x-auto whitespace-nowrap"
                  >
                    {endpoint}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Events Published */}
        {selectedEntity.eventsPublished &&
          selectedEntity.eventsPublished.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Events Published ({selectedEntity.eventsPublished.length})
                </h3>
                {selectedEntity.eventsPublished.length > 5 && (
                  <button
                    onClick={() => toggleSection("eventsPublished")}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {expandedSections.eventsPublished
                      ? "Show Less"
                      : "Show All"}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {selectedEntity.eventsPublished
                  .slice(0, expandedSections.eventsPublished ? undefined : 5)
                  .map((event: string, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {event}
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Events Consumed */}
        {selectedEntity.eventsConsumed &&
          selectedEntity.eventsConsumed.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Events Consumed ({selectedEntity.eventsConsumed.length})
                </h3>
                {selectedEntity.eventsConsumed.length > 5 && (
                  <button
                    onClick={() => toggleSection("eventsConsumed")}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {expandedSections.eventsConsumed ? "Show Less" : "Show All"}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {selectedEntity.eventsConsumed
                  .slice(0, expandedSections.eventsConsumed ? undefined : 5)
                  .map((event: string, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {event}
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Databases */}
        {selectedEntity.dbs && selectedEntity.dbs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Databases ({selectedEntity.dbs.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedEntity.dbs.map((db: string, index: number) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                >
                  {db}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {selectedEntity.use_cases && selectedEntity.use_cases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Use Cases ({selectedEntity.use_cases.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedEntity.use_cases.map(
                (useCase: string, index: number) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                  >
                    {useCase}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Documentation Links */}
        {selectedEntity.docLinks && selectedEntity.docLinks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Documentation ({selectedEntity.docLinks.length})
            </h3>
            <div className="space-y-2">
              {selectedEntity.docLinks.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-primary hover:text-primary/80 text-sm break-all underline"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Additional Properties */}
        {Object.keys(selectedEntity).some(
          (key) =>
            ![
              "name",
              "description",
              "repoUrl",
              "context",
              "database_type",
              "access",
              "environment",
              "endpoint_url",
              "database_server",
              "endpoints",
              "eventsPublished",
              "eventsConsumed",
              "dbs",
              "use_cases",
              "docLinks",
              "type",
            ].includes(key)
        ) && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Additional Properties
            </h3>
            <div className="space-y-2">
              {Object.entries(selectedEntity).map(([key, value]) => {
                if (
                  [
                    "name",
                    "description",
                    "repoUrl",
                    "context",
                    "database_type",
                    "access",
                    "environment",
                    "endpoint_url",
                    "database_server",
                    "endpoints",
                    "eventsPublished",
                    "eventsConsumed",
                    "dbs",
                    "use_cases",
                    "docLinks",
                    "type",
                  ].includes(key)
                ) {
                  return null;
                }
                return (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-foreground">{key}:</span>{" "}
                    <span className="text-muted-foreground">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
