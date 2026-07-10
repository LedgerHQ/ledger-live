import { lazy } from "react";
import type { CardComponent } from "./types";

export const components: CardComponent[] = [
  { id: "playground", Component: lazy(() => import("./components/playground")) },
];
