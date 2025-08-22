# Form Builder - SOLID Architecture

This form builder has been restructured following SOLID principles into a modular architecture with clear separation of concerns.

## File Structure

```
app/src/
├── types/
│   └── FormTypes.ts          # Layer 1-4: Core types, registry, resolver, factory
├── hooks/
│   └── useForm.ts            # Layer 5: Form state management
├── components/
│   └── FormComponents.tsx    # Layer 6-7: UI components and component library
├── FB.tsx                    # Main entry point with re-exports
└── ExampleUsage.tsx          # Usage examples
```

## Architecture Layers

### Layer 1: Core Types & Interfaces (Domain Layer)

**File:** `types/FormTypes.ts`

- **Single Responsibility:** Define domain types and interfaces
- **Open/Closed:** Extensible through interfaces
- **Dependency Inversion:** Depends on abstractions, not concretions

```typescript
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
```

### Layer 2: Registry Service (Business Logic Layer)

**File:** `types/FormTypes.ts`

- **Single Responsibility:** Manage form control definitions
- **Interface Segregation:** Clean, focused API

```typescript
export class FormControlRegistry {
  preset(key: string, type: ControlType, props: ControlProps): FormControlDefinition;
  get(key: string): FormControlDefinition;
  getAll(): FormControlDefinition[];
  initFromJson(json: Record<string, { type: ControlType; props: ControlProps }>): void;
}
```

### Layer 3: Component Resolver (Service Layer)

**File:** `types/FormTypes.ts`

- **Single Responsibility:** Resolve component types to actual components
- **Dependency Inversion:** Works with any component configuration

```typescript
export class ComponentResolver {
  constructor(private config: InputConfig) {}
  resolve(type: ControlType): React.ComponentType<any> | string;
}
```

### Layer 4: Form Factory (Presentation Layer Coordinator)

**File:** `types/FormTypes.ts`

- **Single Responsibility:** Coordinate between registry and resolver
- **Factory Pattern:** Creates form instances with proper configuration

```typescript
export function createInputFactory(config?: InputConfig, controls?: FormControlDefinition[]);
```

### Layer 5: Form State Management (State Layer)

**File:** `hooks/useForm.ts`

- **Single Responsibility:** Manage form state, validation, and submission
- **Custom Hooks:** Encapsulate state logic
- **Context Pattern:** Provide state to component tree

```typescript
export function useForm<T>(
  initialValues: T,
  schema?: Record<string, any>,
  config?: InputConfig,
  validator?: (values: T) => Record<string, string>
): [FormInstance<T>];
export function FormProvider<T>({ initialValues, children }: { initialValues: T; children: React.ReactNode });
export function useFormContext<T>(): FormContextType<T>;
```

### Layer 6: Input Components (Presentation Layer)

**File:** `components/FormComponents.tsx`

- **Single Responsibility:** Each component has one job
- **Composition:** Components are composed of smaller, focused components
- **Props Interface:** Clean, well-defined interfaces

```typescript
export const NativeInput = ({ name, label, helpText, required, formInstance, type = "text", ...rest }: FieldProps & Record<string, any>)
export const NativeCheckbox = ({ name, label, helpText, required, formInstance, ...rest }: FieldProps & Record<string, any>)
export const NativeSelect = ({ name, label, helpText, required, options = [], placeholder, formInstance, ...rest }: FieldProps & { options?: Array<{ value: string | number; label: string; disabled?: boolean }>; placeholder?: string } & Record<string, any>)
// ... more components
```

### Layer 7: Component Library (Application Layer)

**File:** `components/FormComponents.tsx`

- **Single Responsibility:** Provide factory functions for creating form instances
- **Configuration:** Allow custom component configurations
- **Default Configurations:** Provide sensible defaults

```typescript
export function createFormFactory(config?: InputConfig, controls?: FormControlDefinition[]);
export const NATIVE_INPUT_CONFIG: InputConfig;
```

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)

- Each file has one clear responsibility
- Each class/function has one reason to change
- Components are focused on specific input types

### 2. Open/Closed Principle (OCP)

- Open for extension through interfaces
- Closed for modification through factory patterns
- New component types can be added without changing existing code

### 3. Liskov Substitution Principle (LSP)

- All form components follow the same interface
- Components can be substituted without breaking functionality
- Factory pattern ensures consistent behavior

### 4. Interface Segregation Principle (ISP)

- Clean, focused interfaces for each layer
- Components only depend on interfaces they use
- No fat interfaces that force unnecessary dependencies

### 5. Dependency Inversion Principle (DIP)

- High-level modules don't depend on low-level modules
- Both depend on abstractions
- Configuration-driven component resolution

## Usage Examples

### Using useForm Hook

```typescript
import { useForm, NATIVE_INPUT_CONFIG } from "./FB";

const [form] = useForm(
  { name: "", email: "" },
  {
    name: { type: "text", props: { label: "Name", required: true } },
    email: { type: "email", props: { label: "Email", required: true } },
  },
  NATIVE_INPUT_CONFIG
);

// Render all fields
{
  form.renderAll();
}
```

### Using FormProvider

```typescript
import { FormProvider, useFormContext, NativeInput } from "./FB";

<FormProvider initialValues={{ name: "", email: "" }}>
  <FormFields />
</FormProvider>;
```

### Using Form Factory

```typescript
import { createFormFactory, NATIVE_INPUT_CONFIG } from "./FB";

const formFactory = createFormFactory(NATIVE_INPUT_CONFIG, [
  { key: "name", type: "text", props: { label: "Name" } },
  { key: "email", type: "email", props: { label: "Email" } },
]);

{
  formFactory.renderAll();
}
```

### Custom Components

```typescript
const customConfig = {
  components: {
    text: CustomInput,
    email: CustomInput,
  },
  defaultComponent: CustomInput,
};

const formFactory = createFormFactory(customConfig, [{ key: "name", type: "text", props: { label: "Custom Name" } }]);
```

## Benefits of This Structure

1. **Maintainability:** Clear separation of concerns makes code easier to maintain
2. **Testability:** Each layer can be tested independently
3. **Extensibility:** New features can be added without modifying existing code
4. **Reusability:** Components and hooks can be reused across different forms
5. **Type Safety:** Strong TypeScript support throughout the architecture
6. **Performance:** Optimized re-renders through proper state management
7. **Developer Experience:** Clear APIs and comprehensive examples

## Migration from Monolithic Structure

The original `FB.tsx` file now serves as a compatibility layer, re-exporting all functionality from the modular structure. Existing code should continue to work without changes, while new code can take advantage of the improved architecture.
