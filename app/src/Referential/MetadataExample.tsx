import { useState } from "react";
import ODataMetadataFetcher from "./ODataMetadataFetcher";

export default function MetadataExample() {
  const [selectedEntity, setSelectedEntity] = useState("Product");
  const [baseUrl, setBaseUrl] = useState("http://localhost:5134");

  const entities = ["Product", "Category", "Customer", "Order", "OrderItem"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>OData Metadata Fetcher Example</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Base URL:
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            style={{ marginLeft: "10px", width: "300px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Entity:
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ODataMetadataFetcher
        baseUrl={baseUrl}
        entityName={selectedEntity}
        onMetadataLoaded={(metadata) => {
          console.log(`Metadata loaded for ${selectedEntity}:`, metadata);
        }}
        onError={(error) => {
          console.error(`Error loading metadata for ${selectedEntity}:`, error);
        }}
      />
    </div>
  );
}
