/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
import * as React from "react";
// =============================================================================
// LAYER 1: CORE TYPES & INTERFACES (Domain Layer)
// =============================================================================
export type ControlProps = Record<string, any>;
export type ControlType = string;
export interface FormControlDefinition {
  key: string;
  type: ControlType;
  props: ControlProps;
}
export interface InputConfig {
  components?: Partial<Record<ControlType, React.ComponentType<any> | string>>;
  defaultComponent?: React.ComponentType<any> | string;
}
// =============================================================================
// LAYER 2: REGISTRY SERVICE (Business Logic Layer)
// =============================================================================
class FormControlRegistry {
  private registry: Map<string, FormControlDefinition> = new Map();
  preset(key: string, type: ControlType, props: ControlProps): FormControlDefinition {
    const definition = { key, type, props };
    this.registry.set(key, definition);
    return definition;
  }
  get(key: string): FormControlDefinition {
    const definition = this.registry.get(key);
    if (!definition) {
      throw new Error(`Unknown control: ${key}`);
    }
    return definition;
  }
  getAll(): FormControlDefinition[] {
    return Array.from(this.registry.values());
  }
  initFromJson(json: Record<string, { type: ControlType; props: ControlProps }>): void {
    Object.entries(json).forEach(([key, { type, props }]) => {
      this.preset(key, type, props);
    });
  }
}
// =============================================================================
// LAYER 3: COMPONENT RESOLVER (Service Layer)
// =============================================================================
class ComponentResolver {
  constructor(private config: InputConfig) {}
  resolve(type: ControlType): React.ComponentType<any> | string {
    return this.config.components?.[type] || this.config.defaultComponent || "input";
  }
}
// =============================================================================
// LAYER 4: FORM FACTORY (Presentation Layer Coordinator)
// =============================================================================
export function createInputFactory(config?: InputConfig, controls?: FormControlDefinition[]) {
  const registry = new FormControlRegistry();
  const resolver = new ComponentResolver(config || {});
  function field(key: string, overrides?: ControlProps) {
    const definition = registry.get(key);
    const Component = resolver.resolve(definition.type);
    return React.createElement(Component, {
      ...definition.props,
      ...overrides,
      name: key,
      key,
    });
  }
  function renderAll(overridesByKey?: Record<string, ControlProps>) {
    return registry.getAll().map((def) => field(def.key, overridesByKey?.[def.key]));
  }
  // Initialize with provided controls
  if (controls) {
    controls.forEach((control) => registry.preset(control.key, control.type, control.props));
  }
  return {
    preset: registry.preset.bind(registry),
    get: registry.get.bind(registry),
    field,
    renderAll,
    initFromJson: registry.initFromJson.bind(registry),
    config,
  } as const;
}
// =============================================================================
// LAYER 5: FORM STATE MANAGEMENT (State Layer)
// =============================================================================
type FormContextType<T> = {
  values: T;
  setValue: (key: keyof T, value: any) => void;
};
const FormContext = React.createContext<FormContextType<any> | undefined>(undefined);
// Form State Hook (Single Responsibility: State Access)
export function useFormContext<T extends Record<string, any>>(): FormContextType<T> {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used inside <FormProvider>");
  }
  return context as FormContextType<T>;
}
// Form State Provider (Single Responsibility: State Management)
export function FormProvider<T extends Record<string, any>>({
  initialValues,
  children,
}: {
  initialValues: T;
  children: React.ReactNode;
}) {
  const [values, setValues] = React.useState<T>(initialValues);
  const setValue = React.useCallback((key: keyof T, value: any) => {
    setValues((prevValues) => ({ ...prevValues, [key]: value }));
  }, []);
  const contextValue: FormContextType<T> = React.useMemo(() => ({ values, setValue }), [values, setValue]);
  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
}
// =============================================================================
// LAYER 6: INPUT COMPONENTS (Presentation Layer)
// =============================================================================
// Base Input Component (Single Responsibility: Text Input Rendering)
const NativeInput = ({ name, ...rest }: { name: string } & Record<string, any>) => {
  const { values, setValue } = useFormContext<any>();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );
  return <input {...rest} value={values[name] ?? ""} onChange={handleChange} />;
};
// Checkbox Input Component (Single Responsibility: Checkbox Input Rendering)
const NativeCheckbox = ({ name, ...rest }: { name: string } & Record<string, any>) => {
  const { values, setValue } = useFormContext<any>();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.checked);
    },
    [name, setValue]
  );
  return <input {...rest} type="checkbox" checked={!!values[name]} onChange={handleChange} />;
};
// =============================================================================
// LAYER 7: COMPONENT LIBRARY (Application Layer)
// =============================================================================
// Factory creator function (accepts custom component configurations)
export function createNativeInputFactory(config?: InputConfig, controls?: FormControlDefinition[]) {
  // Default native component configuration
  const defaultConfig: InputConfig = {
    components: {
      text: NativeInput,
      number: NativeInput,
      checkbox: NativeCheckbox,
    },
    defaultComponent: NativeInput,
  };
  // Merge custom config with defaults
  const finalConfig: InputConfig = {
    components: {
      ...defaultConfig.components,
      ...config?.components,
    },
    defaultComponent: config?.defaultComponent || defaultConfig.defaultComponent,
  };
  return createInputFactory(finalConfig, controls);
}
// Predefined configurations for different UI libraries
export const NATIVE_INPUT_CONFIG: InputConfig = {
  components: {
    text: NativeInput,
    number: NativeInput,
    checkbox: NativeCheckbox,
  },
  defaultComponent: NativeInput,
};
// Example: Material-UI style configuration (placeholder)
export const MATERIAL_INPUT_CONFIG: InputConfig = {
  components: {
    text: NativeInput, // Would be MaterialInput in real implementation
    number: NativeInput, // Would be MaterialNumberInput
    checkbox: NativeCheckbox, // Would be MaterialCheckbox
  },
  defaultComponent: NativeInput,
};
// Example: Bootstrap style configuration (placeholder)
export const BOOTSTRAP_INPUT_CONFIG: InputConfig = {
  components: {
    text: NativeInput, // Would be BootstrapInput in real implementation
    number: NativeInput, // Would be BootstrapNumberInput
    checkbox: NativeCheckbox, // Would be BootstrapCheckbox
  },
  defaultComponent: NativeInput,
};
// =============================================================================
// LAYER 8: EXAMPLE USAGE (Application Layer)
// =============================================================================
// Form Schema Definition (Single Responsibility: Data Structure)
type UserForm = { username: string; age: number; accept: boolean };
const USER_FORM_SCHEMA = {
  username: { type: "text", props: { placeholder: "Username" } },
  age: { type: "number", props: { type: "number" } },
  accept: { type: "checkbox", props: {} },
} as const;
const INITIAL_VALUES: UserForm = {
  username: "name",
  age: 18,
  accept: false,
};
// Inner Form Component (Single Responsibility: Form Rendering)
function InnerForm() {
  const { values } = useFormContext<UserForm>();
  // Create isolated factory instance for this form with native components
  const formFactory = React.useMemo(() => {
    const factory = createNativeInputFactory(NATIVE_INPUT_CONFIG);
    factory.initFromJson(USER_FORM_SCHEMA);
    return factory;
  }, []);
  const handleSubmit = React.useCallback(() => {
    console.log("Form values:", values);
  }, [values]);
  return (
    <form>
      <div>
        <label>Username:</label>
        {formFactory.field("username")}
      </div>
      <div>
        <label>Age:</label>
        {formFactory.field("age")}
      </div>
      <div>
        <label>
          {formFactory.field("accept")}
          Accept Terms
        </label>
      </div>
      <button type="button" onClick={handleSubmit}>
        Submit
      </button>
    </form>
  );
}
// Main Form Component (Single Responsibility: Form Composition)
export default function ExampleForm() {
  return (
    <div>
      <h2>User Form (Native Components)</h2>
      <FormProvider<UserForm> initialValues={INITIAL_VALUES}>
        <InnerForm />
      </FormProvider>
      <hr />
      <h2>Product Form (Material Style)</h2>
      <ProductForm />
      <hr />
      <h2>Custom Form (Custom Components)</h2>
      <CustomForm />
    </div>
  );
}
// =============================================================================
// EXAMPLE 2: ISOLATED PRODUCT FORM (Demonstrates Isolation)
// =============================================================================
type ProductForm = { name: string; price: number; featured: boolean };
const PRODUCT_FORM_SCHEMA = {
  name: { type: "text", props: { placeholder: "Product Name" } },
  price: { type: "number", props: { type: "number", step: "0.01" } },
  featured: { type: "checkbox", props: {} },
} as const;
const PRODUCT_INITIAL_VALUES: ProductForm = {
  name: "",
  price: 0,
  featured: false,
};
function ProductFormInner() {
  const { values } = useFormContext<ProductForm>();
  // This form uses Material-UI style components (demonstrates different flavor)
  const productFactory = React.useMemo(() => {
    const factory = createNativeInputFactory(MATERIAL_INPUT_CONFIG);
    factory.initFromJson(PRODUCT_FORM_SCHEMA);
    return factory;
  }, []);
  const handleSubmit = React.useCallback(() => {
    console.log("Product values:", values);
  }, [values]);
  return (
    <form>
      <div>
        <label>Product Name:</label>
        {productFactory.field("name")}
      </div>
      <div>
        <label>Price:</label>
        {productFactory.field("price")}
      </div>
      <div>
        <label>
          {productFactory.field("featured")}
          Featured Product
        </label>
      </div>
      <button type="button" onClick={handleSubmit}>
        Submit Product
      </button>
    </form>
  );
}
function ProductForm() {
  return (
    <FormProvider<ProductForm> initialValues={PRODUCT_INITIAL_VALUES}>
      <ProductFormInner />
    </FormProvider>
  );
}
// =============================================================================
// EXAMPLE 3: CUSTOM COMPONENT CONFIGURATION (Demonstrates Flexibility)
// =============================================================================
// Custom input component with styling
const StyledInput = ({ name, ...rest }: { name: string } & Record<string, any>) => {
  const { values, setValue } = useFormContext<any>();
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, event.target.value);
    },
    [name, setValue]
  );
  return (
    <input
      {...rest}
      value={values[name] ?? ""}
      onChange={handleChange}
      style={{
        padding: "8px 12px",
        border: "2px solid #007acc",
        borderRadius: "4px",
        fontSize: "14px",
      }}
    />
  );
};
type SettingsForm = { theme: string; notifications: boolean };
const SETTINGS_FORM_SCHEMA = {
  theme: { type: "text", props: { placeholder: "Enter theme name" } },
  notifications: { type: "checkbox", props: {} },
} as const;
const SETTINGS_INITIAL_VALUES: SettingsForm = {
  theme: "dark",
  notifications: true,
};
function SettingsFormInner() {
  const { values } = useFormContext<SettingsForm>();
  // Custom configuration with styled components (memoized to prevent recreating)
  const customConfig: InputConfig = React.useMemo(
    () => ({
      components: {
        text: StyledInput,
        checkbox: NativeCheckbox, // Mix and match different components
      },
      defaultComponent: StyledInput,
    }),
    []
  );
  const settingsFactory = React.useMemo(() => {
    const factory = createNativeInputFactory(customConfig);
    factory.initFromJson(SETTINGS_FORM_SCHEMA);
    return factory;
  }, [customConfig]);
  const handleSubmit = React.useCallback(() => {
    console.log("Settings values:", values);
  }, [values]);
  return (
    <form>
      <div>
        <label>Theme:</label>
        {settingsFactory.field("theme")}
      </div>
      <div>
        <label>
          {settingsFactory.field("notifications")}
          Enable Notifications
        </label>
      </div>
      <button type="button" onClick={handleSubmit}>
        Save Settings
      </button>
    </form>
  );
}
function CustomForm() {
  return (
    <FormProvider<SettingsForm> initialValues={SETTINGS_INITIAL_VALUES}>
      <SettingsFormInner />
    </FormProvider>
  );
}
*/
