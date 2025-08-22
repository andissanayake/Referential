// =============================================================================
// LAYER 8: EXAMPLE USAGE (Application Layer)
// =============================================================================

import React from "react";
import { NATIVE_INPUT_CONFIG, useForm } from "./Builder/old/FB";

// Form Schema Definition (Single Responsibility: Data Structure)
type UserForm = {
  username: string;
  email: string;
  password: string;
  age: number;
  accept: boolean;
  country: string;
  birthdate: string;
  gender: string;
  appointmentTime: string;
  bio: string;
  skills: string[];
};

const USER_FORM_SCHEMA = {
  username: {
    type: "text",
    props: {
      label: "Username",
      placeholder: "Enter your username",
      helpText: "Must be at least 3 characters long",
      required: true,
    },
  },
  email: {
    type: "email",
    props: {
      label: "Email Address",
      type: "email",
      placeholder: "user@example.com",
      helpText: "We'll never share your email",
      required: true,
    },
  },
  password: {
    type: "password",
    props: {
      label: "Password",
      type: "password",
      placeholder: "Enter a secure password",
      helpText: "Must be at least 8 characters",
      required: true,
    },
  },
  age: {
    type: "number",
    props: {
      label: "Age",
      type: "number",
      helpText: "You must be 18 or older",
      required: true,
    },
  },
  birthdate: {
    type: "date",
    props: {
      label: "Birth Date",
      helpText: "Select your date of birth",
      required: true,
      type: "date",
    },
  },
  appointmentTime: {
    type: "datetime",
    props: {
      label: "Appointment Date & Time",
      helpText: "Choose your preferred appointment slot",
      required: true,
      type: "datetime-local",
    },
  },
  country: {
    type: "select",
    props: {
      label: "Country",
      placeholder: "Select your country",
      helpText: "Choose your country of residence",
      required: true,
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
        { value: "de", label: "Germany" },
        { value: "fr", label: "France" },
        { value: "jp", label: "Japan" },
        { value: "au", label: "Australia" },
        { value: "other", label: "Other" },
      ],
    },
  },
  gender: {
    type: "radio",
    props: {
      label: "Gender",
      helpText: "Select your gender",
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
        { value: "prefer-not-to-say", label: "Prefer not to say" },
      ],
    },
  },
  bio: {
    type: "textarea",
    props: {
      label: "Bio",
      placeholder: "Tell us about yourself...",
      helpText: "Brief description about yourself (max 500 characters)",
      rows: 4,
      maxLength: 500,
      required: false,
    },
  },
  skills: {
    type: "multiselect",
    props: {
      label: "Skills",
      helpText: "Select all technologies you're familiar with",
      required: true,
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "react", label: "React" },
        { value: "vue", label: "Vue.js" },
        { value: "angular", label: "Angular" },
        { value: "nodejs", label: "Node.js" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "csharp", label: "C#" },
        { value: "sql", label: "SQL" },
      ],
    },
  },
  accept: {
    type: "checkbox",
    props: {
      label: "I accept the terms and conditions",
      required: true,
    },
  },
} as const;

const INITIAL_VALUES: UserForm = {
  username: "",
  email: "",
  password: "",
  age: 18,
  accept: false,
  country: "",
  birthdate: "",
  gender: "",
  appointmentTime: "",
  bio: "",
  skills: [],
};

// Validation function
const validateUserForm = (values: UserForm): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!values.username || values.username.length < 3) {
    errors.username = "Username must be at least 3 characters long";
  }
  if (!values.email || !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!values.password || values.password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }
  if (!values.age || values.age < 18) {
    errors.age = "You must be 18 or older";
  }
  if (!values.birthdate) {
    errors.birthdate = "Please select your birth date";
  }
  if (!values.appointmentTime) {
    errors.appointmentTime = "Please select an appointment time";
  }
  if (!values.country) {
    errors.country = "Please select your country";
  }
  if (!values.gender) {
    errors.gender = "Please select your gender";
  }
  if (!values.skills || values.skills.length === 0) {
    errors.skills = "Please select at least one skill";
  }
  if (!values.accept) {
    errors.accept = "You must accept the terms and conditions";
  }
  return errors;
};
// NEW: Simplified Form Component using useForm hook
export default function ExampleForm() {
  const [form] = useForm<UserForm>(INITIAL_VALUES, USER_FORM_SCHEMA, NATIVE_INPUT_CONFIG, validateUserForm);
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      form.submit(); // Uses built-in validation and submit
    },
    [form]
  );
  return (
    <form onSubmit={handleSubmit} style={{ width: "500px", margin: "0 auto" }}>
      {form.renderAll()}
      <button type="submit" style={{ padding: "8px 16px", marginTop: "8px" }}>
        Submit
      </button>
      {/* Optional: Manual access to form methods */}
      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <button type="button" onClick={() => form.resetValues()} style={{ padding: "4px 8px", fontSize: "12px" }}>
          Reset
        </button>
        <button
          type="button"
          onClick={() =>
            form.patchValues({
              username: "demo_user",
              email: "demo@example.com",
            })
          }
          style={{ padding: "4px 8px", fontSize: "12px" }}
        >
          Load Demo Data
        </button>
      </div>
    </form>
  );
}
