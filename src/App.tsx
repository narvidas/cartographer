import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Search, X } from "lucide-react";
import EntityDetailsPanel from "./components/EntityDetailsPanel";
import SearchComponent from "./components/SearchComponent";
import InteractiveSystemMap from "./components/SystemMap";

function App() {
  const [data, setData] = useState<any | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/systems.json")
      .then((res) => res.json())
      .then(setData);
  }, []);

  // ESC key handler to close details panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEntity) {
        handleCloseDetailsPanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedEntity]);

  // Global keyboard shortcut for SHIFT+CMD/CTRL+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for SHIFT+CMD+F (Mac) or SHIFT+CTRL+F (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault(); // Prevent default browser search
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchResultSelect = (result: any) => {
    // Find the actual entity in our data that matches the search result
    let entityToSelect = null;

    // Search through services
    if (data?.services) {
      entityToSelect = data.services.find(
        (service: any) =>
          service.name === result.name || service.id === result.id
      );
    }

    // Search through databases
    if (!entityToSelect && data?.databases) {
      entityToSelect = data.databases.find(
        (db: any) =>
          db.alias === result.name ||
          db.name === result.name ||
          db.id === result.id
      );
    }

    // Search through contexts
    if (!entityToSelect && data?.contexts) {
      entityToSelect = data.contexts.find(
        (context: any) =>
          context.name === result.name || context.id === result.id
      );
    }

    // If we found a matching entity, select it
    if (entityToSelect) {
      setSelectedEntity(entityToSelect);
      console.log("Selected entity from search:", entityToSelect);
    } else {
      // If no exact match, use the search result as is
      setSelectedEntity(result);
      console.log("Selected search result:", result);
    }
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
  };

  const handleNodeClick = (entity: any) => {
    setSelectedEntity(entity);
    console.log("Clicked entity:", entity);
  };

  const handleCloseDetailsPanel = () => {
    setSelectedEntity(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Cartographer
                </h1>
                <p className="text-muted-foreground">
                  Enterprise architecture exploration and visualisation tool
                </p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <SearchComponent
                    ref={searchInputRef}
                    onResultSelect={handleSearchResultSelect}
                    onSearchResults={handleSearchResults}
                    className="pl-10"
                  />
                </div>
                {selectedEntity && (
                  <Button
                    onClick={handleCloseDetailsPanel}
                    className="flex items-center space-x-2 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear</span>
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground opacity-60 mt-1 ml-12">
                Press SHIFT+
                {navigator.platform.includes("Mac") ? "CMD" : "CTRL"}+F to
                search
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* React Flow Visualization */}
        <div className={`h-full ${selectedEntity ? "pr-[420px]" : ""}`}>
          {data ? (
            <InteractiveSystemMap
              data={data}
              onNodeClick={handleNodeClick}
              selectedEntity={selectedEntity}
              searchResults={searchResults}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle className="text-center">
                    Loading System Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading system architecture data...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Entity Details Panel */}
        <EntityDetailsPanel
          selectedEntity={selectedEntity}
          onClose={handleCloseDetailsPanel}
        />
      </div>
    </div>
  );
}

export default App;
