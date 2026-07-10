import type { ComponentType, LazyExoticComponent } from "react";

export type CardComponent = {
  id: string;
  Component: LazyExoticComponent<ComponentType>;
};
