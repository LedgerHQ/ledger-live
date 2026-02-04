import type {
  ArrowDown,
  Plus,
  Minus,
  ArrowUp,
  LedgerLogo,
  Cart,
} from "@ledgerhq/lumen-ui-react/symbols";

// Use the actual type from lumen-ui-react symbols
export type IconComponent =
  | typeof ArrowDown
  | typeof Plus
  | typeof Minus
  | typeof ArrowUp
  | typeof LedgerLogo
  | typeof Cart;

export type QuickAction = {
  title: string;
  onAction: () => void;
  icon: IconComponent;
  disabled: boolean;
  buttonAppearance?: "base" | "transparent";
};
