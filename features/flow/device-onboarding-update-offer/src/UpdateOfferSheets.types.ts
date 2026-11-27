export type OfferedUpdate = Readonly<{
  current: string;
  available: string;
}>;

export type UpdateOfferSheet = "offer" | "confirmSkip";

/** What the user saw or pressed, for the consumer's analytics. */
export type UpdateOfferEvent =
  | Readonly<{ type: "shown"; sheet: UpdateOfferSheet }>
  | Readonly<{ type: "pressed"; sheet: UpdateOfferSheet; button: "update" | "close" | "skip" }>;

export type UpdateOfferSheetsProps = Readonly<{
  /** The update the device is offered, or null once it is answered. */
  update: OfferedUpdate | null;
  /** Opens on the skip confirmation instead of the offer, after the release notes closed. */
  confirmSkip: boolean;
  suspendSheets: boolean;
  onUpdate: () => void;
  onSkip: () => void;
  onTrack?: (event: UpdateOfferEvent) => void;
}>;
