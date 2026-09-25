import type { CardAssetRow } from "@features/flow-pay-card-assets";

/** The card-linked wallet the top-up lands in. */
export type CardTopUpDestination = Pick<
  CardAssetRow,
  "address" | "currency" | "ticker" | "ledgerId"
>;

export type CardTopUpParams = Readonly<{
  accountId: string;
  destination: CardTopUpDestination;
}>;
