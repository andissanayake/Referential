/* eslint-disable @typescript-eslint/no-explicit-any */

import ODataCreateForm from "./ODataCreateForm";

export default function CreateFormExample() {
  const handleSuccess = (createdEntity: any) => {
    console.log("Created entity:", createdEntity);
  };

  const handleError = (error: string) => {
    console.error("Error creating entity:", error);
    alert(`Error: ${error}`);
  };

  const handleCancel = () => {};

  return (
    <div style={{ padding: "20px" }}>
      <h1>OData Create Form Example</h1>
      <div style={{ marginBottom: "40px" }}>
        <h2>Product Form 1</h2>
        <ODataCreateForm
          formId="form-1"
          baseUrl="http://localhost:5134"
          entityName="Product"
          onSuccess={handleSuccess}
          onError={handleError}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
