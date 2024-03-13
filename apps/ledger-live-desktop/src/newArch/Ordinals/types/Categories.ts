import { LayoutKey } from "./Layouts";

export type CategoryKey = "inscriptions" | "rareSats";

export type Category = {
  value: CategoryKey;
  title: string;
  Component: ({ layout }: { layout: LayoutKey }) => JSX.Element;
};
