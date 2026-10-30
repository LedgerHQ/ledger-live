import {
  hyperliquidSignIntentDefinition,
  type HyperliquidSignIntentPlatformDefinition,
} from "@features/platform-hyperliquid-sign-intent";
import { HyperliquidSignIntentComponentLWM } from "./componentLWM";

export const hyperliquidSignIntentLWMDefinition: HyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: HyperliquidSignIntentComponentLWM,
};
