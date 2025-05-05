import { AccountLike } from "@ledgerhq/types-live";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";

type FeatureProps = {
  llmNftSupportEnabled?: boolean;
  llmSolanaNftsEnabled?: boolean;
};

export function isNFTCollectionsDisplayable(
  account: AccountLike,
  isAccountEmpty: boolean,
  { llmSolanaNftsEnabled = false, llmNftSupportEnabled = false }: FeatureProps,
): boolean {
  return (
    llmNftSupportEnabled &&
    !isAccountEmpty &&
    account.type === "Account" &&
    isNFTActive(account.currency) &&
    (account.currency.id !== "solana" || llmSolanaNftsEnabled)
  );
}
