/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { XMLParser } from "fast-xml-parser";

interface ODataCRUDConfig {
  baseUrl: string;
  cacheTimeout?: number; // Cache timeout in milliseconds (default: 5 minutes)
  instanceId?: string; // Unique identifier for this hook instance
}

interface EntityMetadata {
  name: string;
  properties: PropertyMetadata[];
  navigationProperties: NavigationPropertyMetadata[];
}

interface PropertyMetadata {
  name: string;
  type: string;
  nullable: boolean;
  maxLength?: number;
  displayName?: string;
  description?: string;
  placeholder?: string;
}

interface NavigationPropertyMetadata {
  name: string;
  type: string;
  nullable: boolean;
  isCollection: boolean;
  partner?: string;
}

interface ODataResponse<T> {
  value: T[];
  "@odata.count"?: number;
}

interface ODataError {
  error: {
    code: string;
    message: string;
  };
}

interface MetadataCache {
  data: EntityMetadata;
  timestamp: number;
  expiresAt: number;
}

// Global cache for metadata across all instances
const metadataCache = new Map<string, MetadataCache>();

// Global debounce timers for initialization (per baseUrl)
const initMetadataTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Global shared metadata state (per baseUrl)
const sharedMetadataState = new Map<string, any>();

export function useODataCRUD<T = any>({ baseUrl, cacheTimeout = 5 * 60 * 1000, instanceId }: ODataCRUDConfig) {
  console.log(`useODataCRUD hook initialized for instance: ${instanceId}`);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [allMetadata, setAllMetadata] = useState<any>(() => {
    // Initialize with shared metadata if available
    return sharedMetadataState.get(baseUrl) || null;
  });

  // Check if cached metadata is still valid
  const isCacheValid = useCallback((cache: MetadataCache): boolean => {
    return Date.now() < cache.expiresAt;
  }, []);

  // Debug logging for cache operations
  const logCacheOperation = useCallback((operation: string, key: string, data?: any) => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      console.log(`[OData Cache] ${operation}:`, key, data);
    }
  }, []);

  // Clear cache for specific entity
  const clearCache = useCallback(
    (entityName: string) => {
      const cacheKey = `${baseUrl}:${entityName}`;
      logCacheOperation("CLEAR", cacheKey);
      metadataCache.delete(cacheKey);
    },
    [baseUrl, logCacheOperation]
  );

  // Clear all metadata cache
  const clearAllCache = useCallback(() => {
    logCacheOperation("CLEAR_ALL", "all");
    metadataCache.clear();
  }, [logCacheOperation]);

  // GET all entities with optional OData query parameters
  const getAll = useCallback(
    async (entityName: string, query?: string): Promise<T[]> => {
      setLoading(true);
      setError(null);

      try {
        const url = query ? `${baseUrl}/odata/${entityName}?${query}` : `${baseUrl}/odata/${entityName}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData: ODataError = await response.json();
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data: ODataResponse<T> = await response.json();
        return data.value || [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // GET single entity by ID
  const getById = useCallback(
    async (entityName: string, id: number | string, expand?: string): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const url = expand
          ? `${baseUrl}/odata/${entityName}(${id})?$expand=${expand}`
          : `${baseUrl}/odata/${entityName}(${id})`;

        const response = await fetch(url);

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          const errorData: ODataError = await response.json();
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // POST - Create new entity
  const create = useCallback(
    async (entityName: string, entity: Partial<T>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/odata/${entityName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entity),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle OData validation errors
          if (errorData.error?.details) {
            // Extract field-specific validation errors
            const validationErrors: Record<string, string> = {};
            errorData.error.details.forEach((detail: any) => {
              if (detail.target && detail.message) {
                // Extract field name from target (e.g., "Name" from "Name")
                const fieldName = detail.target.replace(/^#\//, ""); // Remove OData path prefix
                validationErrors[fieldName] = detail.message;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          // Handle ModelState validation errors (ASP.NET Core format)
          if (errorData.error?.message && typeof errorData.error.message === "object") {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData.error.message).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0]; // Take the first error message
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          // Handle other OData errors
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        if (err && typeof err === "object" && "type" in err && err.type === "validation") {
          // Re-throw validation errors to be handled by the form
          throw err;
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // PUT - Update entity completely
  const update = useCallback(
    async (entityName: string, id: number | string, entity: Partial<T>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/odata/${entityName}(${id})`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entity),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle OData validation errors
          if (errorData.error?.details) {
            const validationErrors: Record<string, string> = {};
            errorData.error.details.forEach((detail: any) => {
              if (detail.target && detail.message) {
                const fieldName = detail.target.replace(/^#\//, "");
                validationErrors[fieldName] = detail.message;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          // Handle ModelState validation errors (ASP.NET Core format)
          if (errorData.error?.message && typeof errorData.error.message === "object") {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData.error.message).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0]; // Take the first error message
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        if (err && typeof err === "object" && "type" in err && err.type === "validation") {
          throw err;
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // PATCH - Update entity partially
  const patch = useCallback(
    async (entityName: string, id: number | string, entity: Partial<T>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/odata/${entityName}(${id})`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entity),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle OData validation errors
          if (errorData.error?.details) {
            const validationErrors: Record<string, string> = {};
            errorData.error.details.forEach((detail: any) => {
              if (detail.target && detail.message) {
                const fieldName = detail.target.replace(/^#\//, "");
                validationErrors[fieldName] = detail.message;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          // Handle ModelState validation errors (ASP.NET Core format)
          if (errorData.error?.message && typeof errorData.error.message === "object") {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData.error.message).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0]; // Take the first error message
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              throw { type: "validation", errors: validationErrors };
            }
          }

          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        if (err && typeof err === "object" && "type" in err && err.type === "validation") {
          throw err;
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // DELETE - Delete entity
  const remove = useCallback(
    async (entityName: string, id: number | string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/odata/${entityName}(${id})`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData: ODataError = await response.json();
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // Fetch metadata for the entity with caching
  const fetchMetadata = useCallback(
    async (entityName: string, forceRefresh = false): Promise<EntityMetadata | null> => {
      const cacheKey = `${baseUrl}:${entityName}`;

      // Check cache first (unless force refresh is requested)
      if (!forceRefresh) {
        const cached = metadataCache.get(cacheKey);
        logCacheOperation("CHECK", cacheKey, cached ? "HIT" : "MISS");
        if (cached && isCacheValid(cached)) {
          logCacheOperation("RETURN_CACHED", cacheKey, cached.data.name);
          setMetadata(cached.data);
          return cached.data;
        }
      }

      logCacheOperation("FETCH", cacheKey, forceRefresh ? "FORCE_REFRESH" : "CACHE_MISS");
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/odata/$metadata`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const xmlText = await response.text();

        // Parse XML → JS object
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "",
        });

        const parsedMetadata = parser.parse(xmlText);

        // Extract entity metadata
        const entityData = extractEntityMetadata(parsedMetadata, entityName);

        if (!entityData) {
          throw new Error(`Entity '${entityName}' not found in metadata`);
        }

        // Cache the metadata
        const now = Date.now();
        const cacheEntry: MetadataCache = {
          data: entityData,
          timestamp: now,
          expiresAt: now + cacheTimeout,
        };
        metadataCache.set(cacheKey, cacheEntry);
        logCacheOperation("STORE", cacheKey, entityData.name);

        setMetadata(entityData);
        return entityData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, cacheTimeout, isCacheValid, logCacheOperation]
  );

  // Extract entity metadata from parsed OData metadata
  function extractEntityMetadata(parsedMetadata: any, targetEntityName: string): EntityMetadata | null {
    try {
      const schemas = parsedMetadata["edmx:Edmx"]["edmx:DataServices"]["Schema"];
      const schema = Array.isArray(schemas) ? schemas[0] : schemas;

      if (!schema.EntityType) {
        return null;
      }

      const entityTypes = Array.isArray(schema.EntityType) ? schema.EntityType : [schema.EntityType];

      const targetEntity = entityTypes.find((entity: any) => entity.Name === targetEntityName);

      if (!targetEntity) {
        return null;
      }

      // Extract properties
      const properties: PropertyMetadata[] = [];
      if (targetEntity.Property) {
        const props = Array.isArray(targetEntity.Property) ? targetEntity.Property : [targetEntity.Property];

        props.forEach((prop: any) => {
          // Extract display attributes from OData annotations
          // Try multiple annotation namespaces for better compatibility
          const displayName =
            prop["@_sap:label"] ||
            prop["@_sap:display-format"] ||
            prop["@_sap:quickinfo"] ||
            prop["@_microsoft:displayName"] ||
            prop["@_microsoft:label"] ||
            prop["@_odata:displayName"] ||
            prop["@_odata:label"];

          const description =
            prop["@_sap:quickinfo"] ||
            prop["@_sap:label"] ||
            prop["@_microsoft:description"] ||
            prop["@_odata:description"];

          const placeholder =
            prop["@_sap:placeholder"] ||
            prop["@_sap:display-format"] ||
            prop["@_microsoft:placeholder"] ||
            prop["@_odata:placeholder"];

          properties.push({
            name: prop.Name,
            type: prop.Type,
            nullable: prop.Nullable === "true",
            maxLength: prop.MaxLength ? parseInt(prop.MaxLength) : undefined,
            displayName,
            description,
            placeholder,
          });
        });
      }

      // Extract navigation properties
      const navigationProperties: NavigationPropertyMetadata[] = [];
      if (targetEntity.NavigationProperty) {
        const navProps = Array.isArray(targetEntity.NavigationProperty)
          ? targetEntity.NavigationProperty
          : [targetEntity.NavigationProperty];

        navProps.forEach((navProp: any) => {
          navigationProperties.push({
            name: navProp.Name,
            type: navProp.Type,
            nullable: navProp.Nullable === "true",
            isCollection: navProp.Type.startsWith("Collection("),
            partner: navProp.Partner,
          });
        });
      }

      return {
        name: targetEntity.Name,
        properties,
        navigationProperties,
      };
    } catch (err) {
      console.error("Error extracting entity metadata:", err);
      return null;
    }
  }

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility functions for form generation
  const getFieldType = useCallback((odataType: string, fieldName: string): string => {
    // Check for specific field patterns first
    const fieldNameLower = fieldName.toLowerCase();
    if (fieldNameLower.includes("email") || fieldNameLower.includes("mail")) {
      return "email";
    }
    if (fieldNameLower.includes("url") || fieldNameLower.includes("link") || fieldNameLower.includes("website")) {
      return "url";
    }
    if (fieldNameLower.includes("phone") || fieldNameLower.includes("mobile") || fieldNameLower.includes("tel")) {
      return "tel";
    }
    if (fieldNameLower.includes("password")) {
      return "password";
    }
    if (
      fieldNameLower.includes("description") ||
      fieldNameLower.includes("notes") ||
      fieldNameLower.includes("comment")
    ) {
      return "textarea";
    }

    // Then check OData types
    switch (odataType) {
      case "Edm.String":
        return "text";
      case "Edm.Int32":
      case "Edm.Int64":
        return "number";
      case "Edm.Decimal":
      case "Edm.Double":
        return "number";
      case "Edm.Boolean":
        return "checkbox";
      case "Edm.DateTime":
      case "Edm.DateTimeOffset":
        return "date";
      default:
        return "text";
    }
  }, []);

  const getInitialValue = useCallback((odataType: string): any => {
    switch (odataType) {
      case "Edm.String":
        return "";
      case "Edm.Int32":
      case "Edm.Int64":
      case "Edm.Decimal":
      case "Edm.Double":
        return 0;
      case "Edm.Boolean":
        return false;
      case "Edm.DateTime":
      case "Edm.DateTimeOffset":
        return "";
      default:
        return "";
    }
  }, []);

  // Debounced initialization function
  const debouncedInitializeMetadata = useCallback(async () => {
    // Clear existing timer for this baseUrl
    if (initMetadataTimers.has(baseUrl)) {
      clearTimeout(initMetadataTimers.get(baseUrl)!);
    }

    // Return a promise that resolves when the debounced initialization completes
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${baseUrl}/odata/$metadata`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const xmlText = await response.text();
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
          });
          const parsedMetadata = parser.parse(xmlText);
          console.log("Parsed metadata:", parsedMetadata);

          // Log available entities
          try {
            const schemas = parsedMetadata["edmx:Edmx"]["edmx:DataServices"]["Schema"];
            const schema = Array.isArray(schemas) ? schemas[0] : schemas;
            if (schema.EntityType) {
              const entityTypes = Array.isArray(schema.EntityType) ? schema.EntityType : [schema.EntityType];
              console.log(
                "Available entities:",
                entityTypes.map((e: any) => e.Name)
              );
            }
          } catch {
            console.log("Could not extract entity names from metadata");
          }

          console.log(`Setting allMetadata for instance: ${instanceId}`);
          // Store in shared state for all instances with this baseUrl
          sharedMetadataState.set(baseUrl, parsedMetadata);
          setAllMetadata(parsedMetadata);
          resolve();
        } catch (err) {
          console.error("Error initializing metadata:", err);
          reject(err);
        } finally {
          // Clean up the timer reference
          initMetadataTimers.delete(baseUrl);
        }
      }, 300); // 300ms debounce delay

      // Store the timer reference
      initMetadataTimers.set(baseUrl, timer);
    });
  }, [baseUrl]);

  // Initialize metadata once (like a constructor)
  useEffect(() => {
    debouncedInitializeMetadata().catch(console.error);
  }, [debouncedInitializeMetadata]);

  // Sync with shared metadata changes
  useEffect(() => {
    const checkSharedMetadata = () => {
      const shared = sharedMetadataState.get(baseUrl);
      if (shared && !allMetadata) {
        console.log(`Syncing shared metadata for instance: ${instanceId}`);
        setAllMetadata(shared);
      }
    };

    // Check immediately
    checkSharedMetadata();

    // Set up interval to check for shared metadata
    const interval = setInterval(checkSharedMetadata, 100);

    return () => clearInterval(interval);
  }, [baseUrl, allMetadata, instanceId]);

  const generateFormSchema = useCallback(
    (entityName: string) => {
      try {
        if (!allMetadata) return { schema: {}, initialValues: {} };

        const entityMetadata = extractEntityMetadata(allMetadata, entityName);
        if (!entityMetadata?.properties) return { schema: {}, initialValues: {} };

        const schema: Record<string, { type: string; props: any }> = {};
        const initialValues: Record<string, any> = {};

        entityMetadata.properties
          .filter((prop: any) => {
            // Skip system properties and IDs
            return (
              !prop.name.startsWith("__") &&
              prop.name !== "Id" &&
              prop.name !== "id" &&
              !prop.name.toLowerCase().includes("id")
            );
          })
          .forEach((prop: any) => {
            const fieldType = getFieldType(prop.type, prop.name);
            initialValues[prop.name] = getInitialValue(prop.type);

            schema[prop.name] = {
              type: fieldType,
              props: {
                label: prop.displayName || prop.name,
                helpText: prop.description,
                placeholder: prop.placeholder || `Enter ${prop.name.toLowerCase()}`,
                required: !prop.nullable,
                ...(prop.maxLength && { maxLength: prop.maxLength }),
                ...(prop.type === "Edm.Decimal" || prop.type === "Edm.Double" ? { step: "0.01" } : {}),
                // For date fields, ensure the NativeDateTimePicker gets the correct type
                ...(fieldType === "date" && { type: "date" }),
              },
            };
          });

        return { schema, initialValues };
      } catch (error) {
        console.error("Error generating form schema:", error);
        return { schema: {}, initialValues: {} };
      }
    },
    [allMetadata, getFieldType, getInitialValue]
  );

  return {
    // CRUD operations
    getAll,
    getById,
    create,
    update,
    patch,
    remove,

    // Metadata operations
    fetchMetadata,
    metadata,
    allMetadata,

    // Cache operations
    clearCache,
    clearAllCache,

    // Form utilities
    getFieldType,
    getInitialValue,
    generateFormSchema,

    // State
    loading,
    error,
    clearError,
  };
}
