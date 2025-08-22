/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

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

export class FormControlRegistry {
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

export class ComponentResolver {
  private config: InputConfig;

  constructor(config: InputConfig) {
    this.config = config;
  }

  resolve(type: ControlType): React.ComponentType<any> | string {
    return this.config.components?.[type] || this.config.defaultComponent || "input";
  }
}

export function createInputFactory(config?: InputConfig, controls?: FormControlDefinition[]) {
  const registry = new FormControlRegistry();
  const resolver = new ComponentResolver(config || {});

  function field(key: string, overrides?: ControlProps, formInstance?: any) {
    const definition = registry.get(key);
    const Component = resolver.resolve(definition.type);
    return React.createElement(Component, {
      ...definition.props,
      ...overrides,
      name: key,
      key,
      formInstance,
    });
  }

  function renderAll(overrides?: Record<string, ControlProps>, formInstance?: any) {
    return registry.getAll().map((definition) => {
      const Component = resolver.resolve(definition.type);
      return React.createElement(Component, {
        ...definition.props,
        ...(overrides?.[definition.key] || {}),
        name: definition.key,
        key: definition.key,
        formInstance,
      });
    });
  }

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
