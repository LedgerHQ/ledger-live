import { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";

/**
 * Available transfer action identifiers
 */
export type TransferActionId = "receive" | "send" | "bank_transfer";

/**
 * Available quick action CTA identifiers
 */
export type QuickActionCtaId = "transfer" | "swap" | "buy" | "connect" | "buy_ledger";

/**
 * User state for quick actions display
 */
export type UserQuickActionsState = "no_signer" | "no_funds" | "has_funds";

/**
 * Represents a quick action CTA button configuration
 */
export interface QuickActionCta {
  readonly id: QuickActionCtaId;
  readonly label: string;
  readonly icon: TileButtonProps["icon"];
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}

/**
 * Represents a transfer action item in the drawer
 */
export interface TransferAction {
  readonly id: TransferActionId;
  readonly title: string;
  readonly description?: string;
  readonly icon: TileButtonProps["icon"];
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}

/**
 * Props for QuickActionsCtas component
 */
export interface QuickActionsCtasProps {
  /** Source screen name for analytics */
  readonly sourceScreenName?: string;
}

/**
 * Props for TransferDrawer component
 */
export interface TransferDrawerProps {
  /** Whether the drawer is open */
  readonly isOpen: boolean;
  /** Callback when drawer is closed */
  readonly onClose: () => void;
  /** Source screen name for analytics */
  readonly sourceScreenName?: string;
}
