import type { ReactNode } from "react";
import type { StakePositionHeading } from "../../types";

export type StakePositionSurfaceProps = Readonly<{
  isOpen: boolean;
  heading: StakePositionHeading;
  ticker: string;
  /** The header's back button, shown while the surface is dismissible. */
  onBack?: () => void;
  onDismiss: () => void;
  /** Off once the transaction is signed: no close button, Escape, backdrop or Android back. */
  isDismissible: boolean;
  /** The step's body and actions: a view of this package, or on web the host's dialog sections. */
  children: ReactNode;
  testID?: string;
}>;
