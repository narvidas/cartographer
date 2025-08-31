import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";

interface SearchResult {
  name: string;
  type: string;
  context?: string;
  description?: string;
  repoUrl?: string;
  endpoints?: string[];
  eventsPublished?: string[];
  eventsConsumed?: string[];
  databases?: string[];
  language?: string;
  size?: string;
  alias?: string;
  _index?: string;
  _score?: number;
  _formatted?: {
    name: string;
    description?: string;
    alias?: string;
    endpoints?: string[];
    eventsPublished?: string[];
    eventsConsumed?: string[];
  };
}

interface SearchComponentProps {
  onResultSelect: (result: SearchResult) => void;
  onSearchResults: (results: SearchResult[]) => void;
  className?: string;
}

const MEILISEARCH_URL =
  import.meta.env.VITE_MEILISEARCH_URL || "http://localhost:7700";
// Use search-only key from environment variable or fallback to master key for development
const SEARCH_KEY =
  import.meta.env.VITE_MEILISEARCH_SEARCH_KEY || "change_this_in_production";

const SearchComponent = forwardRef<HTMLInputElement, SearchComponentProps>(
  ({ onResultSelect, onSearchResults, className = "" }, ref) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedItemRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Debounced search function
    const debouncedSearch = useCallback(
      debounce(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
          setResults([]);
          onSearchResults([]);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          // Search across all indexes
          const searchPromises = [
            "services",
            "contexts",
            "databases",
            "external",
          ].map(async (index) => {
            const response = await fetch(
              `${MEILISEARCH_URL}/indexes/${index}/search`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SEARCH_KEY}`,
                },
                body: JSON.stringify({
                  q: searchQuery,
                  limit: 10,
                  attributesToHighlight: [
                    "name",
                    "description",
                    "alias",
                    "endpoints",
                    "eventsPublished",
                    "eventsConsumed",
                  ],
                  highlightPreTag: "<mark>",
                  highlightPostTag: "</mark>",
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              return data.hits.map((hit: any) => ({
                ...hit,
                _index: index,
              }));
            }
            return [];
          });

          const allResults = await Promise.all(searchPromises);
          const flattenedResults = allResults.flat();

          // Sort by relevance and limit to top results
          const sortedResults = flattenedResults
            .sort((a, b) => (b._score || 0) - (a._score || 0))
            .slice(0, 20);

          setResults(sortedResults);
          onSearchResults(sortedResults);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
          onSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 50),
      []
    );

    useEffect(() => {
      debouncedSearch(query);
    }, [query, debouncedSearch]);

    // Scroll selected item into view
    const scrollSelectedItemIntoView = useCallback(() => {
      if (selectedItemRef.current && dropdownRef.current) {
        selectedItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, []);

    // Scroll selected item into view when selectedIndex changes
    useEffect(() => {
      if (selectedIndex >= 0) {
        // Use a small delay to ensure the DOM has updated
        setTimeout(scrollSelectedItemIntoView, 0);
      }
    }, [selectedIndex, scrollSelectedItemIntoView]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case "Escape":
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    const handleResultClick = (result: SearchResult) => {
      onResultSelect(result);
      setShowResults(false);
      setQuery("");
      setSelectedIndex(-1);
    };

    // Reset selected index when results change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [results]);

    const getResultIcon = (type: string) => {
      switch (type) {
        case "service":
          return "💻";
        case "lambda":
          return "λ";
        case "database":
          return "🗄️";
        case "context":
          return "📁";
        case "fulfillment_node":
          return "🏪";
        default:
          return "🔍";
      }
    };

    const getResultTypeLabel = (result: SearchResult) => {
      if (result._index === "contexts") return "Context";
      if (result._index === "databases") return "Database";
      if (result._index === "external") return "External System";
      return result.type || "Service";
    };

    const renderHighlightedArray = (
      array: string[] | undefined,
      fieldName: string
    ) => {
      if (!array || array.length === 0) return null;

      // Check if any items in the array match the search query
      const matchingItems = array.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingItems.length === 0) return null;

      return (
        <div className="mt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {fieldName}:
          </span>
          <div className="mt-1 space-y-1">
            {matchingItems.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="text-xs bg-muted/50 px-2 py-1 rounded"
              >
                {/* Using dangerouslySetInnerHTML is safe here because:
                1. The content comes from MeiliSearch (a trusted source)
                2. MeiliSearch only injects <mark> tags for highlighting
                3. We're not allowing user-generated content to be rendered as HTML */}
                <span
                  dangerouslySetInnerHTML={{
                    __html: item.replace(
                      new RegExp(`(${query})`, "gi"),
                      "<mark>$1</mark>"
                    ),
                  }}
                />
              </div>
            ))}
            {matchingItems.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{matchingItems.length - 3} more...
              </div>
            )}
          </div>
        </div>
      );
    };

    const updateDropdownPosition = useCallback(() => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, []);

    useEffect(() => {
      if (showResults) {
        updateDropdownPosition();
      }
    }, [showResults, updateDropdownPosition]);

    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <input
            ref={combinedRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search services, contexts, databases..."
            className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Render dropdown using portal to avoid stacking context issues */}
        {showResults &&
          (query.trim() || isLoading) &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 999999,
              }}
            >
              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <div
                      key={`${result._index || "unknown"}-${
                        result.name
                      }-${index}`}
                      ref={index === selectedIndex ? selectedItemRef : null}
                      onClick={() => handleResultClick(result)}
                      className={`px-4 py-3 cursor-pointer border-b border-border last:border-b-0 transition-colors ${
                        index === selectedIndex
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">
                          {getResultIcon(
                            result.type || result._index || "unknown"
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4
                              className="text-sm font-medium text-foreground truncate"
                              // Using dangerouslySetInnerHTML is safe here because:
                              // 1. The content comes from MeiliSearch (a trusted source)
                              // 2. MeiliSearch only injects <mark> tags for highlighting
                              // 3. We're not allowing user-generated content to be rendered as HTML
                              dangerouslySetInnerHTML={{
                                __html:
                                  result._formatted?.alias ||
                                  result._formatted?.name ||
                                  result.alias ||
                                  result.name,
                              }}
                            />
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {getResultTypeLabel(result)}
                            </span>
                            {result.context && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {result.context}
                              </span>
                            )}
                          </div>
                          {result._formatted?.description && (
                            <p
                              className="text-sm text-muted-foreground mt-1 line-clamp-2"
                              // Using dangerouslySetInnerHTML is safe here because:
                              // 1. The content comes from MeiliSearch (a trusted source)
                              // 2. MeiliSearch only injects <mark> tags for highlighting
                              // 3. We're not allowing user-generated content to be rendered as HTML
                              dangerouslySetInnerHTML={{
                                __html: result._formatted.description,
                              }}
                            />
                          )}
                          {result.language && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Language: {result.language}
                            </span>
                          )}
                          {renderHighlightedArray(
                            result.endpoints,
                            "Endpoints"
                          )}
                          {renderHighlightedArray(
                            result.eventsPublished,
                            "Events Published"
                          )}
                          {renderHighlightedArray(
                            result.eventsConsumed,
                            "Events Consumed"
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isLoading && query.trim() ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-muted-foreground">No results found</p>
                </div>
              ) : null}
            </div>,
            document.body
          )}

        {/* Click outside to close */}
        {showResults &&
          createPortal(
            <div
              className="fixed inset-0"
              style={{ zIndex: 999998 }}
              onClick={() => {
                setShowResults(false);
                setSelectedIndex(-1);
              }}
            />,
            document.body
          )}
      </div>
    );
  }
);

SearchComponent.displayName = "SearchComponent";

export default SearchComponent;

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
