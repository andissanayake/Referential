/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { XMLParser } from "fast-xml-parser";

interface ODataCRUDConfig {
  baseUrl: string;
  entityName: string; // The entity this hook will work with
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

export function useODataCRUD<T = any>({ baseUrl, entityName }: ODataCRUDConfig) {
  console.log(`useODataCRUD hook initialized for entity: ${entityName}`);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allMetadata, setAllMetadata] = useState<any>(null);
  const [formSchema, setFormSchema] = useState<{ schema: any; initialValues: any }>({ schema: {}, initialValues: {} });
  const [navigationOptions, setNavigationOptions] = useState<
    Record<string, Array<{ value: string | number; label: string }>>
  >({});

  // GET all entities with optional OData query parameters
  const getAll = useCallback(
    async (query?: string): Promise<T[]> => {
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
    [baseUrl, entityName]
  );

  // GET single entity by ID
  const getById = useCallback(
    async (id: number | string, expand?: string): Promise<T | null> => {
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
    [baseUrl, entityName]
  );

  // POST - Create new entity
  const create = useCallback(
    async (entity: Partial<T>): Promise<T> => {
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
          console.log("Create error response:", errorData);

          // Handle direct validation errors format: {"Name":["The Product Name field is required."]}
          if (typeof errorData === "object" && !errorData.error) {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0];
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              console.log("Create validation errors found:", validationErrors);
              throw { type: "validation", errors: validationErrors };
            }
          }

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
                validationErrors[fieldName] = messages[0];
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
    [baseUrl, entityName]
  );

  // PUT - Update entity completely
  const update = useCallback(
    async (id: number | string, entity: Partial<T>): Promise<T> => {
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
          console.log("Update error response:", errorData);

          // Handle direct validation errors format: {"Name":["The Product Name field is required."]}
          if (typeof errorData === "object" && !errorData.error) {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0];
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              console.log("Update validation errors found:", validationErrors);
              throw { type: "validation", errors: validationErrors };
            }
          }

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
                validationErrors[fieldName] = messages[0];
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
    [baseUrl, entityName]
  );

  // PATCH - Update entity partially
  const patch = useCallback(
    async (id: number | string, entity: Partial<T>): Promise<T> => {
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
          console.log("Patch error response:", errorData);

          // Handle direct validation errors format: {"Name":["The Product Name field is required."]}
          if (typeof errorData === "object" && !errorData.error) {
            const validationErrors: Record<string, string> = {};
            Object.entries(errorData).forEach(([fieldName, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[fieldName] = messages[0];
              } else if (typeof messages === "string") {
                validationErrors[fieldName] = messages;
              }
            });

            if (Object.keys(validationErrors).length > 0) {
              console.log("Patch validation errors found:", validationErrors);
              throw { type: "validation", errors: validationErrors };
            }
          }

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
                validationErrors[fieldName] = messages[0];
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
    [baseUrl, entityName]
  );

  // DELETE - Delete entity
  const remove = useCallback(
    async (id: number | string): Promise<void> => {
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
    [baseUrl, entityName]
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

  // Initialize metadata and form schema once
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch metadata
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
        console.log(parsedMetadata);
        console.log(`Setting allMetadata for entity: ${entityName}`);
        setAllMetadata(parsedMetadata);

        // Generate form schema
        const entityMetadata = extractEntityMetadata(parsedMetadata, entityName);
        console.log(entityMetadata);
        if (entityMetadata) {
          const schema: Record<string, { type: string; props: any }> = {};
          const initialValues: Record<string, any> = {};
          const navOptions: Record<string, Array<{ value: string | number; label: string }>> = {};

          // Handle regular properties
          entityMetadata.properties
            .filter((prop: any) => {
              return (
                !prop.name.startsWith("__") &&
                prop.name !== "Id" &&
                prop.name !== "id" &&
                !prop.name.toLowerCase().includes("id")
              );
            })
            .forEach((prop: any) => {
              const fieldType = getFieldType(prop);
              initialValues[prop.name] = getInitialValue(prop);

              schema[prop.name] = {
                type: fieldType,
                props: {
                  label: prop.displayName || prop.name,
                  helpText: prop.description,
                  placeholder: prop.placeholder || `Enter ${prop.name.toLowerCase()}`,
                  required: !prop.nullable,
                  ...(prop.maxLength && { maxLength: prop.maxLength }),
                  ...(prop.type === "Edm.Decimal" || prop.type === "Edm.Double" ? { step: "0.01" } : {}),
                  ...(fieldType === "date" && { type: "date" }),
                },
              };
            });

          // Handle navigation properties - load all options first
          if (entityMetadata.navigationProperties) {
            const navigationPromises: Promise<void>[] = [];

            for (const navProp of entityMetadata.navigationProperties) {
              if (!navProp.isCollection) {
                // Use the navigation property name directly for the API call
                const targetEntityName = navProp.name;

                // Find the corresponding foreign key field (e.g., "Category" -> "CategoryId")
                const foreignKeyField = `${navProp.name}Id`;
                const hasForeignKey = entityMetadata.properties.some((prop: any) => prop.name === foreignKeyField);

                if (hasForeignKey) {
                  // Use the foreign key field name for the form
                  initialValues[foreignKeyField] = "";

                  schema[foreignKeyField] = {
                    type: "select",
                    props: {
                      label: navProp.name,
                      helpText: `Select ${targetEntityName}`,
                      placeholder: `Choose ${targetEntityName}`,
                      required: !navProp.nullable,
                      options: [], // Will be populated below
                    },
                  };

                  // Create a promise for loading navigation options
                  const loadNavigationOptions = async () => {
                    try {
                      const navResponse = await fetch(`${baseUrl}/odata/${targetEntityName}`);
                      if (navResponse.ok) {
                        const navData = await navResponse.json();
                        const entities = navData.value || navData || [];
                        const options = entities.map((entity: any) => ({
                          value: entity.Id || entity.id || entity.ID,
                          label:
                            entity.Name ||
                            entity.name ||
                            entity.Title ||
                            entity.title ||
                            `ID: ${entity.Id || entity.id || entity.ID}`,
                        }));
                        navOptions[foreignKeyField] = options;
                        // Update the schema with the options
                        schema[foreignKeyField].props.options = options;
                        console.log(`Loaded ${options.length} options for ${navProp.name} (${foreignKeyField})`);
                      }
                    } catch (navErr) {
                      console.error(`Error loading navigation options for ${navProp.name}:`, navErr);
                      navOptions[foreignKeyField] = [];
                    }
                  };

                  navigationPromises.push(loadNavigationOptions());
                } else {
                  console.warn(`No foreign key field found for navigation property ${navProp.name}`);
                }
              }
            }

            // Wait for all navigation options to be loaded
            await Promise.all(navigationPromises);
          }

          // Set form schema after all navigation options are loaded
          setFormSchema({ schema, initialValues });
          setNavigationOptions(navOptions);
          console.log(`Form schema generated for ${entityName}:`, Object.keys(schema));
          console.log(`Navigation options:`, navOptions);
        }
      } catch (err) {
        console.error("Error initializing form:", err);
      }
    };

    initializeForm();
  }, [baseUrl, entityName]);

  // Utility functions for form generation - based on OData metadata
  const getFieldType = useCallback((property: PropertyMetadata): string => {
    // Use OData type from metadata to determine field type
    switch (property.type) {
      case "Edm.String":
        // Check if it's a long text field based on maxLength
        if (property.maxLength && property.maxLength > 255) {
          return "textarea";
        }
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
      case "Edm.Guid":
        return "text"; // GUID as text input
      case "Edm.Binary":
        return "file"; // Binary data as file input
      default:
        // For complex types or navigation properties, default to text
        return "text";
    }
  }, []);

  const getInitialValue = useCallback((property: PropertyMetadata): any => {
    switch (property.type) {
      case "Edm.String":
        return "";
      case "Edm.Int32":
      case "Edm.Int64":
        return 0;
      case "Edm.Decimal":
      case "Edm.Double":
        return 0;
      case "Edm.Boolean":
        return false;
      case "Edm.DateTime":
      case "Edm.DateTimeOffset":
        return "";
      case "Edm.Guid":
        return "";
      case "Edm.Binary":
        return null;
      default:
        return "";
    }
  }, []);

  return {
    // CRUD operations
    getAll,
    getById,
    create,
    update,
    patch,
    remove,

    // Metadata operations
    allMetadata,

    // Form utilities
    formSchema,
    navigationOptions,

    // State
    loading,
    error,
  };
}
