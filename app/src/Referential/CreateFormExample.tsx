/* eslint-disable @typescript-eslint/no-explicit-any */

import ODataCreateForm from "./ODataCreateForm";

export default function CreateFormExample() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>OData Create Form Example</h1>
      <div style={{ marginBottom: "40px" }}>
        <h2>Product Form 1</h2>
        <ODataCreateForm baseUrl="http://localhost:5134" entityName="Product" />
      </div>
    </div>
  );
}
