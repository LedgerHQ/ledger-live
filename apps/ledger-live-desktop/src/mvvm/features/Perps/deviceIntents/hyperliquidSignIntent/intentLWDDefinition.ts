import {
  hyperliquidSignIntentDefinition,
  type HyperliquidSignIntentPlatformDefinition,
} from "@features/platform-hyperliquid-sign-intent";
import { HyperliquidSignIntentComponentLWD } from "./componentLWD";

export const hyperliquidSignIntentLWDDefinition: HyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: HyperliquidSignIntentComponentLWD,
};
