import { useForm } from "./core/useForm";
import { NATIVE_INPUT_CONFIG } from "./FormComponents";

export function ExampleWithUseForm() {
  const [form] = useForm(
    { name: "", email: "", age: 0, subscribe: false },
    {
      name: { type: "text", props: { label: "Name", required: true } },
      email: { type: "email", props: { label: "Email", required: true } },
      age: { type: "number", props: { label: "Age", min: 0, max: 120 } },
      subscribe: { type: "checkbox", props: { label: "Subscribe to newsletter" } },
    },
    NATIVE_INPUT_CONFIG,
    (values) => {
      const errors: Record<string, string> = {};
      if (!values.name) errors.name = "Name is required";
      if (!values.email) errors.email = "Email is required";
      if (values.age < 0) errors.age = "Age must be positive";
      return errors;
    }
  );

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Example with useForm Hook</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
      >
        {form.renderField("name")}
        {form.renderField("email", { placeholder: "Enter your email address override!!!" })}
        {form.renderField("age", { min: 18, max: 100 })}
        {form.renderField("subscribe", { style: { marginTop: "10px" } })}
        <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
          <button type="submit">Submit</button>
          <button
            type="button"
            onClick={() => form.patchValues({ name: "John Doe", email: "john@example.com", age: 25 })}
          >
            Patch Values
          </button>
          <button type="button" onClick={() => form.resetValues()}>
            Reset
          </button>
        </div>
      </form>
      <pre>Values: {JSON.stringify(form.values, null, 2)}</pre>
      <pre>Errors: {JSON.stringify(form.errors, null, 2)}</pre>
    </div>
  );
}

export default function FormExamples() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Form Builder Examples (SOLID Architecture)</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <ExampleWithUseForm />
      </div>
    </div>
  );
}
