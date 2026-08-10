import { Category, type ToolMetadata } from "../../types";

export type { PayCardToolProps } from "@devtools/pay-card";

export const payCard: ToolMetadata = {
  label: "Card / Pay",
  category: Category.FEATURES_AND_FLOWS,
  owner: "Wallet XP",
  desc: "Debug the Card/Pay feature: flags, API mock scenarios, quick states.",
  loader: () => import("@devtools/pay-card"),
};
