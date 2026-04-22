import { Category } from "./types";
import type { Tool } from "./types";

export const TOOLS: Tool[] = [
  { id: "feature-flags", label: "Feature Flags", category: Category.DEV_TOOLS },
  { id: "network-inspector", label: "Network Inspector", category: Category.NETWORK },
  { id: "crypto-utilities", label: "Crypto Utilities", category: Category.DEV_TOOLS },
];
