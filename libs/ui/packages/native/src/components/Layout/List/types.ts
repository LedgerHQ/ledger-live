import { ReactNode } from "react";

export enum ItemStatus {
  inactive = "inactive",
  active = "active",
  completed = "completed",
}

export type Item = {
  status: ItemStatus;
  title: string;
  doneTitle?: string;
  estimatedTime?: number;
  progress?: number;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};
