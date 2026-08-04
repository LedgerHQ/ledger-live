import type { ComponentProps, ReactNode } from "react";
import type { DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";

export type DialogFlowOptions = Readonly<{
  dialogBodyProps?: Omit<ComponentProps<typeof DialogBody>, "children">;
  dialogContentProps?: Omit<ComponentProps<typeof DialogContent>, "children">;
  dialogHeaderProps?: Omit<ComponentProps<typeof DialogHeader>, "onBack" | "onClose">;
  hasBackButton?: boolean;
}>;

export type DialogFlowScreen = Readonly<{
  content: ReactNode;
  options?: DialogFlowOptions;
}>;

export type DialogFlowScreenRegistry<Step extends string> = Readonly<
  Record<Step, DialogFlowScreen>
>;

export type DialogFlowProps<Step extends string> = Readonly<{
  currentStep: Step;
  defaultOptions?: DialogFlowOptions;
  isOpen: boolean;
  onBack?: () => void;
  onClose: () => void;
  screens: DialogFlowScreenRegistry<Step>;
}>;
