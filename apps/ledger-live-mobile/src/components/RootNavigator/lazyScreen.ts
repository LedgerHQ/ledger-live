import type { ComponentType } from "react";

// oxlint-disable-next-line typescript/no-explicit-any
type AnyComponent = ComponentType<any>;

type ModuleWithDefault<T extends AnyComponent> = { default: T };

export function lazyScreen<T extends AnyComponent>(load: () => ModuleWithDefault<T>): () => T {
  return () => load().default;
}

export function lazyNamed<T extends AnyComponent>(load: () => T): () => T {
  return load;
}

export function preloadBaseNavigator(): void {
  void (require("./BaseNavigator") as typeof import("./BaseNavigator"));
}

export function preloadRootNavigator(): void {
  void (require("./index") as typeof import("./index"));
}

export function preloadSettingsNavigator(): void {
  void (require("./SettingsNavigator") as typeof import("./SettingsNavigator"));
}
