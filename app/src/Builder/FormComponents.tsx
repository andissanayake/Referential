/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { FormContext } from "./core/useForm";
import type { InputConfig } from "./core/FormTypes";

interface FieldProps {
  name: string;
  label?: string;
  helpText?: string;
  required?: boolean;
  formInstance?: any;
}

function getDefaultValue(fieldType: string): any {
  switch (fieldType) {
    case "checkbox":
      return false;
    case "number":
      return 0;
    case "multiselect":
      return [];
    case "select":
    case "radio":
    case "text":
    case "email":
    case "password":
    case "textarea":
    case "date":
    case "datetime":
    case "time":
    default:
      return "";
  }
}

// Helper hook to get form state from either context or props
function useFormState(formInstance?: any): {
  values: any;
  setValue: (key: string, value: any) => void;
  getError: (key: string) => string | undefined;
} {
  // Always call hooks in the same order
  const context = React.useContext(FormContext);

  // If formInstance is provided (useForm hook), use it
  if (formInstance) {
    return {
      values: formInstance.values,
      setValue: formInstance.setValue,
      getError: formInstance.getError,
    };
  }

  // Otherwise, use context (FormProvider pattern)
  if (context) {
    return {
      values: context.values,
      setValue: context.setValue,
      getError: context.getError,
    };
  }

  // Fallback if neither is available
  return {
    values: {},
    setValue: () => {},
    getError: () => undefined,
  };
}

// Label Component (Single Responsibility: Label Rendering)
const FieldLabel = ({ required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
    {children}
    {required && <span style={{ color: "red", marginLeft: "2px" }}>*</span>}
  </div>
);

// Error Message Component (Single Responsibility: Error Display)
const FieldError = ({ error }: { error?: string }) =>
  error ? <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{error}</div> : null;

// Help Text Component (Single Responsibility: Help Text Display)
const FieldHelpText = ({ helpText }: { helpText?: string }) =>
  helpText ? <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>{helpText}</div> : null;

// Field Container Component (Single Responsibility: Field Layout)
const FieldContainer = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ marginBottom: "16px", ...style }}>{children}</div>
);

// Base Input Component (Single Responsibility: Text Input Rendering)
export const NativeInput = ({
  name,
  label,
  helpText,
  required,
  formInstance,
  type = "text",
  ...rest
}: FieldProps & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const hasError = !!error;
  const defaultValue = getDefaultValue(type);
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <input
        {...rest}
        id={inputId}
        type={type}
        value={currentValue}
        onChange={handleChange}
        style={{
          border: hasError ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          width: "100%",
          ...rest.style,
        }}
      />
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// Checkbox Input Component (Single Responsibility: Checkbox Input Rendering)
export const NativeCheckbox = ({
  name,
  label,
  helpText,
  required,
  formInstance,
  ...rest
}: FieldProps & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.checked);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const defaultValue = getDefaultValue("checkbox");
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input {...rest} id={inputId} type="checkbox" checked={!!currentValue} onChange={handleChange} />
        {label && (
          <FieldLabel htmlFor={inputId} required={required}>
            {label}
          </FieldLabel>
        )}
      </div>
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// Select Dropdown Component (Single Responsibility: Select Input Rendering)
export const NativeSelect = ({
  name,
  label,
  helpText,
  required,
  options = [],
  placeholder,
  formInstance,
  ...rest
}: FieldProps & {
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
} & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const hasError = !!error;
  const defaultValue = getDefaultValue("select");
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <select
        {...rest}
        id={inputId}
        value={currentValue}
        onChange={handleChange}
        style={{
          border: hasError ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          width: "100%",
          backgroundColor: "white",
          fontSize: "14px",
          ...rest.style,
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// DateTime Picker Component (Single Responsibility: DateTime Input Rendering)
export const NativeDateTimePicker = ({
  name,
  label,
  helpText,
  required,
  type = "datetime-local", // datetime-local, date, time
  formInstance,
  ...rest
}: FieldProps & {
  type?: "datetime-local" | "date" | "time";
} & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const hasError = !!error;
  const defaultValue = getDefaultValue(type);
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <input
        {...rest}
        id={inputId}
        type={type}
        value={currentValue}
        onChange={handleChange}
        style={{
          border: hasError ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          width: "100%",
          fontSize: "14px",
          ...rest.style,
        }}
      />
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// Radio Group Component (Single Responsibility: Radio Group Rendering)
export const NativeRadio = ({
  name,
  label,
  helpText,
  required,
  options = [],
  formInstance,
  ...rest
}: FieldProps & {
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
} & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );

  const error = getError(name);
  const defaultValue = getDefaultValue("radio");
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {options.map((option, index) => {
          const optionId = `${name}-${option.value}-${index}`;
          return (
            <div key={optionId} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                {...rest}
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={currentValue === option.value}
                onChange={handleChange}
                disabled={option.disabled}
              />
              <label
                htmlFor={optionId}
                style={{
                  fontSize: "14px",
                  cursor: option.disabled ? "not-allowed" : "pointer",
                  color: option.disabled ? "#999" : "inherit",
                }}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// Textarea Component (Single Responsibility: Multi-line Text Input Rendering)
export const NativeTextarea = ({
  name,
  label,
  helpText,
  required,
  rows = 4,
  formInstance,
  ...rest
}: FieldProps & {
  rows?: number;
} & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const hasError = !!error;
  const defaultValue = getDefaultValue("textarea");
  const currentValue = values[name] !== undefined ? values[name] : defaultValue;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <textarea
        {...rest}
        id={inputId}
        rows={rows}
        value={currentValue}
        onChange={handleChange}
        style={{
          border: hasError ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          width: "100%",
          fontSize: "14px",
          fontFamily: "inherit",
          resize: "vertical",
          ...rest.style,
        }}
      />
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

// Multi-Select Component (Single Responsibility: Native Multiple Selection Rendering)
export const NativeMultiSelect = ({
  name,
  label,
  helpText,
  required,
  options = [],
  size = 6,
  formInstance,
  ...rest
}: FieldProps & {
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  size?: number;
} & Record<string, any>) => {
  const { values, setValue, getError } = useFormState(formInstance);

  const defaultValue = getDefaultValue("multiselect");
  const currentValues = React.useMemo(() => {
    const value = values[name];
    if (value !== undefined) {
      return Array.isArray(value) ? value : [];
    }
    return defaultValue;
  }, [values, name, defaultValue]);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(event.target.selectedOptions);
      const selectedValues = selectedOptions.map((option) => option.value);
      setValue(name, selectedValues);
    },
    [name, setValue]
  );

  const inputId = `field-${name}`;
  const error = getError(name);
  const hasError = !!error;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <select
        {...rest}
        id={inputId}
        multiple
        size={size}
        value={currentValues}
        onChange={handleChange}
        style={{
          border: hasError ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          width: "100%",
          backgroundColor: "white",
          fontSize: "14px",
          ...rest.style,
        }}
      >
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldHelpText helpText={helpText} />
      <FieldError error={error} />
    </FieldContainer>
  );
};

export { createInputFactory as createFormFactory } from "./core/FormTypes";
export const NATIVE_INPUT_CONFIG: InputConfig = {
  components: {
    text: NativeInput,
    number: NativeInput,
    email: NativeInput,
    password: NativeInput,
    checkbox: NativeCheckbox,
    select: NativeSelect,
    datetime: NativeDateTimePicker,
    date: NativeDateTimePicker,
    time: NativeDateTimePicker,
    radio: NativeRadio,
    textarea: NativeTextarea,
    multiselect: NativeMultiSelect,
  },
  defaultComponent: NativeInput,
};
