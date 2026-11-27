import type { ReactNode } from "react";
import type { StakePositionHeading } from "../../types";

export type StakePositionSurfaceProps = Readonly<{
  isOpen: boolean;
  /**
   * Names the surface. Only the details title shows in the header: a confirmation or a result
   * leads with its own title, under a header that holds the close button alone.
   */
  heading: StakePositionHeading;
  ticker: string;
  /** The currency's name, which the details title uses ("Earning Solana"). Defaults to the ticker. */
  currencyName?: string;
  onDismiss: () => void;
  /**
   * The surface has finished hiding: the app calls `releaseStakePosition` then, so the content it
   * kept for the animation unmounts.
   */
  onHidden?: () => void;
  /** Off once the transaction is signed: no close button, Escape, backdrop or Android back. */
  isDismissible: boolean;
  /** The step's body and actions: a view of this package, or on web the host's dialog sections. */
  children: ReactNode;
  testID?: string;
}>;
