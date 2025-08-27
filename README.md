/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

// Field types
export type ControlType = string;
export type ControlProps = Record<string, any>;

export interface FormControlDefinition {
  key: string;
  type: ControlType;
  props: ControlProps;
}

export interface InputConfig {
  components?: Partial<Record<ControlType, React.ComponentType<any> | string>>;
  defaultComponent?: React.ComponentType<any> | string;
}

// Factory for creating fields
export class FormFactory {
  private registry = new Map<string, FormControlDefinition>();
  private resolver: InputConfig;

  constructor(config: InputConfig = {}) {
    this.resolver = config;
  }

  preset(key: string, type: ControlType, props: ControlProps) {
    this.registry.set(key, { key, type, props });
  }

  field(key: string, overrides?: ControlProps, formInstance?: any) {
    const def = this.registry.get(key);
    if (!def) throw new Error(`Unknown field: ${key}`);
    const Component =
      this.resolver.components?.[def.type] ||
      this.resolver.defaultComponent ||
      "input";
    return React.createElement(Component, {
      ...def.props,
      ...overrides,
      key,
      name: key,
      formInstance,
    });
  }

  renderAll(overrides?: Record<string, ControlProps>, formInstance?: any) {
    return Array.from(this.registry.values()).map((def) => {
      const Component =
        this.resolver.components?.[def.type] ||
        this.resolver.defaultComponent ||
        "input";
      return React.createElement(Component, {
        ...def.props,
        ...(overrides?.[def.key] || {}),
        key: def.key,
        name: def.key,
        formInstance,
      });
    });
  }

  initFromJson(
    schema: Record<string, { type: ControlType; props: ControlProps }>
  ) {
    Object.entries(schema).forEach(([key, { type, props }]) =>
      this.preset(key, type, props)
    );
  }
}

////////////////////////

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { FormFactory, InputConfig } from "./FormTypes";

export interface FormInstance<T extends Record<string, any>> {
  values: T;
  errors: Record<string, string>;
  setValue: (key: keyof T, value: any) => void;
  patchValues: (values: Partial<T>) => void;
  resetValues: (values?: T) => void;
  validateFields: () => boolean;
  submit: () => void;
  renderField: (key: string, overrides?: any) => React.ReactElement;
  renderAll: (overrides?: Record<string, any>) => React.ReactElement[];
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema?: Record<string, { type: string; props: any }>,
  config?: InputConfig,
  validator?: (values: T) => Record<string, string>
): [FormInstance<T>] {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setValue = React.useCallback((key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key as string];
      return newErrors;
    });
  }, []);

  const patchValues = React.useCallback((patch: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(patch).forEach((k) => {
        delete newErrors[k];
      });
      return newErrors;
    });
  }, []);

  const resetValues = React.useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
    },
    [initialValues]
  );

  const validateFields = React.useCallback(() => {
    if (!validator) return true;
    const newErrors = validator(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validator]);

  const submit = React.useCallback(() => {
    if (validateFields()) console.log("Form submitted:", values);
    else console.log("Validation errors:", errors);
  }, [values, errors, validateFields]);

  const factory = React.useMemo(() => {
    const f = new FormFactory(config);
    if (schema) f.initFromJson(schema);
    return f;
  }, [config, schema]);

  const renderField = React.useCallback(
    (key: string, overrides?: any) =>
      factory.field(key, overrides, { values, setValue, errors }),
    [factory, values, setValue, errors]
  );
  const renderAll = React.useCallback(
    (overrides?: Record<string, any>) =>
      factory.renderAll(overrides, { values, setValue, errors }),
    [factory, values, setValue, errors]
  );

  const formInstance: FormInstance<T> = {
    values,
    errors,
    setValue,
    patchValues,
    resetValues,
    validateFields,
    submit,
    renderField,
    renderAll,
  };
  return [formInstance];
}


////////////////////////////////

/* eslint-disable @typescript-eslint/no-explicit-any */
/* FormComponents.tsx */
import * as React from "react";
import { InputConfig } from "./FormTypes";

// Minimal input components
export const NativeInput = ({ name, formInstance, ...rest }: any) => {
  const value = formInstance?.values?.[name] ?? "";
  const setValue = formInstance?.setValue;
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => setValue(name, e.target.value)}
    />
  );
};

export const NativeCheckbox = ({ name, formInstance, ...rest }: any) => {
  const value = formInstance?.values?.[name] ?? false;
  const setValue = formInstance?.setValue;
  return (
    <input
      type="checkbox"
      {...rest}
      checked={value}
      onChange={(e) => setValue(name, e.target.checked)}
    />
  );
};

export const NATIVE_INPUT_CONFIG: InputConfig = {
  components: {
    text: NativeInput,
    checkbox: NativeCheckbox,
  },
  defaultComponent: NativeInput,
};



