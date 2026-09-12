import type { CardNumbersStatus } from "../../types";

export function isCardNumbersRevealed(
  status: CardNumbersStatus,
  imageUrl: string | undefined,
): imageUrl is string {
  return status === "revealed" && Boolean(imageUrl);
}
