/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// RE-EXPORTS FROM MODULAR STRUCTURE (SOLID Principles)
// =============================================================================

// Re-export all types and interfaces from Layer 1-4
export * from "../core/FormTypes";

// Re-export all form state management from Layer 5
export * from "../core/useForm";

// Re-export all form components and factory from Layer 6-7
export * from "../FormComponents";

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS
// =============================================================================

// For backward compatibility, re-export commonly used items directly
export { useForm, FormProvider, useFormContext } from "../core/useForm";
export {
  createFormFactory,
  NATIVE_INPUT_CONFIG,
  NativeInput,
  NativeCheckbox,
  NativeSelect,
  NativeDateTimePicker,
  NativeRadio,
  NativeTextarea,
  NativeMultiSelect,
} from "../FormComponents";
export { createInputFactory, FormControlRegistry, ComponentResolver } from "../core/FormTypes";
