import { Category, type ToolMetadata } from "../../types";
export type { CurrenciesToolProps } from "@devtools/currencies";

export const currencies: ToolMetadata = {
  label: "Currencies",
  category: Category.DEBUGGING,
  owner: "Platform",
  desc: "Inspect the supported fiats fetched from the Countervalues Service.",
  loader: () => import("@devtools/currencies"),
};
