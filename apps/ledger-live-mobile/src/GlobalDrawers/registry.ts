import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import { PostOnboardingHubDrawerWrapper } from "LLM/features/PostOnboardingHubDrawer";
import ReceiveDrawerWrapper from "LLM/features/Receive/drawers/ReceiveFundsOptionsDrawer";
import RebornBuyDeviceDrawer from "LLM/features/Reborn/drawers/RebornBuyDeviceDrawer";
import { DeeplinkInstallAppDrawer } from "LLM/features/DeeplinkInstallApp";
import { NotificationsPromptWrapper } from "LLM/features/NotificationsPrompt";
import { GenericAwarenessModalDrawerView } from "LLM/features/GenericAwarenessModal/screens/GenericAwarenessModalDrawerView";

/**
 * Registry of all global drawers in the application.
 * The drawer will automatically be rendered in GlobalDrawers.
 */

export interface DrawerRegistryEntry {
  component: React.ComponentType;
}

export const DRAWER_REGISTRY = {
  modularAssets: {
    component: ModularDrawerWrapper,
  },
  postOnboardingHub: {
    component: PostOnboardingHubDrawerWrapper,
  },
  receive: {
    component: ReceiveDrawerWrapper,
  },
  reborn: {
    component: RebornBuyDeviceDrawer,
  },
  deeplinkInstallApp: {
    component: DeeplinkInstallAppDrawer,
  },
  notificationsPrompt: {
    component: NotificationsPromptWrapper,
  },
  genericAwarenessModal: {
    component: GenericAwarenessModalDrawerView,
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
