import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import { ReceiveDrawerWrapper } from "LLM/features/Receive/ReceiveDrawerWrapper";

/**
 * Registry of all global drawers in the application.
 * The drawer will automatically be rendered in GlobalDrawers.
 */

export interface DrawerRegistryEntry {
  component: React.ComponentType;
}

export const DRAWER_REGISTRY = {
  modular: {
    component: ModularDrawerWrapper,
  },
  receive: {
    component: ReceiveDrawerWrapper,
  },
} as const satisfies Record<string, DrawerRegistryEntry>;

/**
 * Type-safe drawer keys derived from the registry.
 * Use this type when you need to reference a specific drawer.
 */
export type DrawerKey = keyof typeof DRAWER_REGISTRY;

/**
 * Array of all drawer entries for iteration.
 */
export const DRAWER_ENTRIES = Object.entries(DRAWER_REGISTRY).map(([key, entry]) => ({
  key,
  ...entry,
}));
