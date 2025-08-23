/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useODataCRUD } from "./useODataCRUD";
import { useForm } from "../Builder/core/useForm";
import { NATIVE_INPUT_CONFIG } from "../Builder/FormComponents";

interface ODataCreateFormProps {
  baseUrl: string;
  entityName: string;
}

export default function ODataCreateForm({ baseUrl, entityName }: ODataCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the OData CRUD hook with entity name
  const { create, formSchema, loading, allMetadata } = useODataCRUD({
    baseUrl,
    entityName,
  });

  console.log(
    `ODataCreateForm ${entityName} - allMetadata:`,
    !!allMetadata,
    "formSchema:",
    Object.keys(formSchema.schema)
  );
  console.log("Form schema details:", formSchema.schema);

  const { schema, initialValues } = formSchema;

  // Create form instance with standard config
  const [formInstance] = useForm(initialValues, schema, NATIVE_INPUT_CONFIG);

  // Handle form submission
  const handleSubmit = async () => {
    if (formInstance.validateFields()) {
      setIsSubmitting(true);
      try {
        const createdEntity = await create(formInstance.values);
        console.log("Successfully created entity:", createdEntity);
        alert(`Successfully created ${entityName}!`);
      } catch (error) {
        console.log("Form submission error:", error);

        // Handle backend validation errors
        if (error && typeof error === "object" && "type" in error && error.type === "validation") {
          // Set field-specific validation errors from backend
          const validationErrors = (error as any).errors;
          console.log("Setting validation errors:", validationErrors);
          Object.entries(validationErrors).forEach(([fieldName, errorMessage]) => {
            console.log(`Setting error for field ${fieldName}:`, errorMessage);
            formInstance.setError(fieldName as any, errorMessage as string);
          });
        } else {
          // Handle other errors
          const errorMessage = error instanceof Error ? error.message : "Failed to create entity";
          console.log("Non-validation error:", errorMessage);
          alert(`Error: ${errorMessage}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Loading state - show loading when metadata is not yet loaded
  if (loading || !allMetadata) {
    console.log(`Form ${entityName} - Loading state: loading=${loading}, allMetadata=${!!allMetadata}`);
    return <div>Loading form configuration for {entityName}...</div>;
  }

  // No form configuration state - only show this if we have metadata but no schema
  if (allMetadata && (!schema || Object.keys(schema).length === 0)) {
    return <div>No form configuration found for {entityName}</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Create New {entityName}</h2>
        <div>{formInstance.renderAll()}</div>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => {
              console.log("Form cancelled");
              alert("Form cancelled");
            }}
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "#f8f9fa",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(formInstance.errors).length > 0}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: isSubmitting || Object.keys(formInstance.errors).length > 0 ? "#6c757d" : "#007bff",
              color: "white",
              cursor: isSubmitting || Object.keys(formInstance.errors).length > 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>

        {/* Validation Errors */}
        {Object.keys(formInstance.errors).length > 0 && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              color: "#721c24",
            }}
          >
            <strong>Please fix the following errors:</strong>
            <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
              {Object.entries(formInstance.errors).map(([field, error]) => (
                <li key={field}>{error as string}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
