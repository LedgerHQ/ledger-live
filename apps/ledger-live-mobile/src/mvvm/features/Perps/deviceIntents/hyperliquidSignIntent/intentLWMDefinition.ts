import {
  hyperliquidSignIntentDefinition,
  type HyperliquidSignIntentPlatformDefinition,
} from "@features/platform-intent-hyperliquid-sign";
import { HyperliquidSignIntentComponentLWM } from "./componentLWM";

export const hyperliquidSignIntentLWMDefinition: HyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: HyperliquidSignIntentComponentLWM,
};
