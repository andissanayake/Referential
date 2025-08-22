/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { createInputFactory } from "./FormTypes";
import type { InputConfig } from "./FormTypes";
export interface FormInstance<T extends Record<string, any>> {
  values: T;
  setValue: (key: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  patchValues: (values: Partial<T>) => void;
  resetValues: (values?: T) => void;
  errors: Record<string, string>;
  setError: (key: keyof T, error: string) => void;
  clearError: (key: keyof T) => void;
  clearAllErrors: () => void;
  hasError: (key: keyof T) => boolean;
  getError: (key: keyof T) => string | undefined;
  validateFields: () => boolean;
  submit: () => void;
  renderField: (key: string, overrides?: any) => React.ReactElement;
  renderAll: (overrides?: Record<string, any>) => React.ReactElement[];
}

type FormContextType<T> = {
  values: T;
  setValue: (key: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  patchValues: (values: Partial<T>) => void;
  resetValues: (values?: T) => void;
  errors: Record<string, string>;
  setError: (key: keyof T, error: string) => void;
  clearError: (key: keyof T) => void;
  clearAllErrors: () => void;
  hasError: (key: keyof T) => boolean;
  getError: (key: keyof T) => string | undefined;
};

export const FormContext = React.createContext<FormContextType<any> | undefined>(undefined);

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema?: Record<string, { type: string; props: any }>,
  config?: InputConfig,
  validator?: (values: T) => Record<string, string>
): [FormInstance<T>] {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setValue = React.useCallback(
    (key: keyof T, value: any) => {
      setValues((prevValues) => ({ ...prevValues, [key]: value }));

      if (errors[key as string]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[key as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setValuesMultiple = React.useCallback((newValues: Partial<T>) => {
    setValues((prevValues) => ({ ...prevValues, ...newValues }));

    const updatedKeys = Object.keys(newValues);
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      updatedKeys.forEach((key) => {
        delete newErrors[key];
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

  const setError = React.useCallback((key: keyof T, error: string) => {
    setErrors((prevErrors) => ({ ...prevErrors, [key as string]: error }));
  }, []);

  const clearError = React.useCallback((key: keyof T) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[key as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const hasError = React.useCallback(
    (key: keyof T) => {
      return !!errors[key as string];
    },
    [errors]
  );

  const getError = React.useCallback(
    (key: keyof T) => {
      return errors[key as string];
    },
    [errors]
  );

  const validateFields = React.useCallback(() => {
    clearAllErrors();
    if (validator) {
      const newErrors = validator(values);
      Object.entries(newErrors).forEach(([key, error]) => {
        setError(key as keyof T, error);
      });
      return Object.keys(newErrors).length === 0;
    }
    return true;
  }, [values, validator, clearAllErrors, setError]);

  const submit = React.useCallback(() => {
    if (validateFields()) {
      console.log("Form submitted:", values);
    } else {
      console.log("Form has validation errors");
    }
  }, [validateFields, values]);

  // Form instance object
  const formInstanceMethods = React.useMemo(
    () => ({
      values,
      setValue,
      setValues: setValuesMultiple,
      patchValues: setValuesMultiple,
      resetValues,
      errors,
      setError,
      clearError,
      clearAllErrors,
      hasError,
      getError,
    }),
    [values, setValue, setValuesMultiple, resetValues, errors, setError, clearError, clearAllErrors, hasError, getError]
  );

  // Form factory instance
  const formFactory = React.useMemo(() => {
    const factory = createInputFactory(config);
    if (schema) {
      factory.initFromJson(schema);
    }
    return factory;
  }, [config, schema]);

  const renderField = React.useCallback(
    (key: string, overrides?: any) => {
      return formFactory.field(key, overrides, formInstanceMethods);
    },
    [formFactory, formInstanceMethods]
  );

  const renderAll = React.useCallback(
    (overrides?: Record<string, any>) => {
      return formFactory.renderAll(overrides, formInstanceMethods);
    },
    [formFactory, formInstanceMethods]
  );

  const formInstance: FormInstance<T> = React.useMemo(
    () => ({
      ...formInstanceMethods,
      validateFields,
      submit,
      renderField,
      renderAll,
    }),
    [formInstanceMethods, validateFields, submit, renderField, renderAll]
  );

  return [formInstance];
}

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
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setValue = React.useCallback(
    (key: keyof T, value: any) => {
      setValues((prevValues) => ({ ...prevValues, [key]: value }));

      if (errors[key as string]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[key as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setValuesMultiple = React.useCallback((newValues: Partial<T>) => {
    setValues((prevValues) => ({ ...prevValues, ...newValues }));

    const updatedKeys = Object.keys(newValues);
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      updatedKeys.forEach((key) => {
        delete newErrors[key];
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

  const setError = React.useCallback((key: keyof T, error: string) => {
    setErrors((prevErrors) => ({ ...prevErrors, [key as string]: error }));
  }, []);

  const clearError = React.useCallback((key: keyof T) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[key as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const hasError = React.useCallback(
    (key: keyof T) => {
      return !!errors[key as string];
    },
    [errors]
  );

  const getError = React.useCallback(
    (key: keyof T) => {
      return errors[key as string];
    },
    [errors]
  );

  const contextValue: FormContextType<T> = React.useMemo(
    () => ({
      values,
      setValue,
      setValues: setValuesMultiple,
      patchValues: setValuesMultiple,
      resetValues,
      errors,
      setError,
      clearError,
      clearAllErrors,
      hasError,
      getError,
    }),
    [values, setValue, setValuesMultiple, resetValues, errors, setError, clearError, clearAllErrors, hasError, getError]
  );

  return React.createElement(FormContext.Provider, { value: contextValue }, children);
}
