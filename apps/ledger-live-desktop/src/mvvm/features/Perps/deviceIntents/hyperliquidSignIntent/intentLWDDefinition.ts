import {
  hyperliquidSignIntentDefinition,
  type HyperliquidSignIntentPlatformDefinition,
} from "@features/platform-intent-hyperliquid-sign";
import { HyperliquidSignIntentComponentLWD } from "./componentLWD";

export const hyperliquidSignIntentLWDDefinition: HyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: HyperliquidSignIntentComponentLWD,
};
