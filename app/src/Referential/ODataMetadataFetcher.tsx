/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useODataCRUD } from "./useODataCRUD";

interface ODataMetadataFetcherProps {
  baseUrl: string;
  entityName: string;
  onMetadataLoaded?: (metadata: any, crudFunctions: any) => void;
  onError?: (error: string) => void;
}

export default function ODataMetadataFetcher({
  baseUrl,
  entityName,
  onMetadataLoaded,
  onError,
}: ODataMetadataFetcherProps) {
  // Get CRUD functions and metadata from the hook (no entityName in config)
  const crudFunctions = useODataCRUD({ baseUrl });

  // Local state to track current entity's metadata
  const [currentMetadata, setCurrentMetadata] = useState<any>(null);

  // Ref to track current entity to prevent unnecessary API calls
  const currentEntityRef = useRef<string | null>(null);

  // Fetch metadata when entityName changes
  useEffect(() => {
    // Only fetch if entityName actually changed
    if (currentEntityRef.current === entityName) {
      return;
    }

    currentEntityRef.current = entityName;

    const loadMetadata = async () => {
      try {
        const metadata = await crudFunctions.fetchMetadata(entityName);
        if (metadata) {
          setCurrentMetadata(metadata);
          if (onMetadataLoaded) {
            onMetadataLoaded(metadata, crudFunctions);
          }
        }
      } catch (error) {
        // Error will be handled by the hook's error state
        console.error("Error loading metadata:", error);
        setCurrentMetadata(null);
      }
    };

    loadMetadata();
  }, [entityName, crudFunctions.fetchMetadata, onMetadataLoaded]);

  // Handle errors from the hook
  useEffect(() => {
    if (crudFunctions.error && onError) {
      onError(crudFunctions.error);
    }
  }, [crudFunctions.error, onError]);

  if (crudFunctions.loading) {
    return <div>Loading metadata for {entityName}...</div>;
  }

  if (crudFunctions.error) {
    return <div>Error: {crudFunctions.error}</div>;
  }

  if (!currentMetadata) {
    return <div>No metadata found for {entityName}</div>;
  }

  const metadata = currentMetadata;

  return (
    <div>
      <h3>Metadata for {metadata.name}</h3>

      <h4>Properties ({metadata.properties.length})</h4>
      <ul>
        {metadata.properties.map((prop: any, index: number) => (
          <li key={index}>
            <strong>{prop.name}</strong>: {prop.type}
            {prop.nullable && " (nullable)"}
            {prop.maxLength && ` (max: ${prop.maxLength})`}
          </li>
        ))}
      </ul>

      <h4>Navigation Properties ({metadata.navigationProperties.length})</h4>
      <ul>
        {metadata.navigationProperties.map((navProp: any, index: number) => (
          <li key={index}>
            <strong>{navProp.name}</strong>: {navProp.type}
            {navProp.nullable && " (nullable)"}
            {navProp.isCollection && " (collection)"}
            {navProp.partner && ` (partner: ${navProp.partner})`}
          </li>
        ))}
      </ul>

      <h4>Available CRUD Functions</h4>
      <ul>
        <li>
          <strong>getAll(entityName, query?)</strong> - Get all entities with optional OData query
        </li>
        <li>
          <strong>getById(entityName, id, expand?)</strong> - Get single entity by ID
        </li>
        <li>
          <strong>create(entityName, entity)</strong> - Create new entity
        </li>
        <li>
          <strong>update(entityName, id, entity)</strong> - Update entity completely
        </li>
        <li>
          <strong>patch(entityName, id, entity)</strong> - Update entity partially
        </li>
        <li>
          <strong>remove(entityName, id)</strong> - Delete entity
        </li>
        <li>
          <strong>fetchMetadata(entityName, forceRefresh?)</strong> - Fetch metadata for entity
        </li>
        <li>
          <strong>clearCache(entityName)</strong> - Clear cache for specific entity
        </li>
        <li>
          <strong>clearAllCache()</strong> - Clear all metadata cache
        </li>
      </ul>

      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5" }}>
        <strong>Hook State:</strong> {crudFunctions.loading ? "Loading..." : "Ready"}
        {crudFunctions.error && <div style={{ color: "red" }}>Error: {crudFunctions.error}</div>}
      </div>

      <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#e8f4fd" }}>
        <strong>Usage Examples:</strong>
        <ul>
          <li>
            Get all products: <code>crudFunctions.getAll("Products")</code>
          </li>
          <li>
            Get product by ID: <code>crudFunctions.getById("Products", 123)</code>
          </li>
          <li>
            Create new product: <code>crudFunctions.create("Products", {"{ name: 'New Product' }"})</code>
          </li>
          <li>
            Update product: <code>crudFunctions.update("Products", 123, {"{ price: 99.99 }"})</code>
          </li>
          <li>
            Delete product: <code>crudFunctions.remove("Products", 123)</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
