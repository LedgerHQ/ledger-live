export type DelayProps = {
  isOpen: boolean;
  /**
   * Delay in ms before displaying the overlay
   */
  delay?: number;
};

export type DesyncOverlayProps = DelayProps & {
  productName: string;
};

export type DesyncOverlayViewProps = {
  shouldDisplay: boolean;
  productName: string;
  borderRadius: number;
  bottomInset: number;
};
