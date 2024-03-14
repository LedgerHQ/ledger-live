import { Account } from "@ledgerhq/types-live";
import { LayoutKey } from "./Layouts";

export type CategoryKey = "inscriptions" | "rareSats";

export type Category = {
  value: CategoryKey;
  title: string;
  Component: ({ layout, account }: { layout: LayoutKey; account: Account }) => JSX.Element;
};
