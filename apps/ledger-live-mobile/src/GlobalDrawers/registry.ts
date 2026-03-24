import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import ReceiveDrawerWrapper from "LLM/features/Receive/drawers/ReceiveFundsOptionsDrawer";
import RebornBuyDeviceDrawer from "LLM/features/Reborn/drawers/RebornBuyDeviceDrawer";
import { DeeplinkInstallAppDrawer } from "LLM/features/DeeplinkInstallApp";
import { modularDrawerIsOpenSelector } from "~/reducers/modularDrawer";
import { receiveOptionsDrawerIsOpenSelector } from "~/reducers/receiveOptionsDrawer";
import { rebornBuyDeviceDrawerIsOpenSelector } from "~/reducers/rebornBuyDeviceDrawer";
import { deeplinkInstallAppDrawerSelector } from "~/reducers/deeplinkInstallApp";
import { State } from "~/reducers/types";

/**
 * Registry of all global drawers in the application.
 * The drawer will automatically be rendered in GlobalDrawers.
 */

export interface DrawerRegistryEntry {
  component: React.ComponentType;
  selector: (state: State) => boolean;
}

export const DRAWER_REGISTRY = {
  modularAssets: {
    component: ModularDrawerWrapper,
    selector: modularDrawerIsOpenSelector,
  },
  receive: {
    component: ReceiveDrawerWrapper,
    selector: receiveOptionsDrawerIsOpenSelector,
  },
  reborn: {
    component: RebornBuyDeviceDrawer,
    selector: rebornBuyDeviceDrawerIsOpenSelector,
  },
  deeplinkInstallApp: {
    component: DeeplinkInstallAppDrawer,
    selector: deeplinkInstallAppDrawerSelector,
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
