export type OfferedUpdate = Readonly<{
  current: string;
  available: string;
}>;

export type UpdateOfferSheetsProps = Readonly<{
  /** The update the device is offered, or null once it is answered. */
  update: OfferedUpdate | null;
  /** Opens on the skip confirmation instead of the offer, after the release notes closed. */
  confirmSkip: boolean;
  suspendSheets: boolean;
  onUpdate: () => void;
  onSkip: () => void;
}>;
