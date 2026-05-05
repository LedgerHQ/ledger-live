import { Category } from "./types";
import type { Tool } from "./types";

export const TOOLS: Tool[] = [
  {
    id: "feature-flags",
    label: "Feature Flags",
    category: Category.CONFIGURATION,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  },
  {
    id: "network-inspector",
    label: "Network Inspector",
    category: Category.CONNECTIVITY,
    owner: "Platform",
  },
  {
    id: "crypto-utilities",
    label: "Crypto Utilities",
    category: Category.DEBUGGING,
    owner: "Platform",
  },
];
