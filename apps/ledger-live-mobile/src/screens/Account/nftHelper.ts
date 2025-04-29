import { AccountLike } from "@ledgerhq/types-live";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";

type SolanaProps = {
  llmSolanaNftsEnabled?: boolean;
};

export function isNFTCollectionsDisplayable(
  account: AccountLike,
  isAccountEmpty: boolean,
  { llmSolanaNftsEnabled = false }: SolanaProps,
): boolean {
  return (
    !isAccountEmpty &&
    account.type === "Account" &&
    isNFTActive(account.currency) &&
    (account.currency.id !== "solana" || llmSolanaNftsEnabled)
  );
}
