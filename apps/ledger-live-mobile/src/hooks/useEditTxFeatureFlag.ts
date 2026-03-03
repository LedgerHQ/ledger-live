import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";

type SupportedEditTxFeature = "editBitcoinTx" | "editEvmTx";

type Props = {
  featureKey: SupportedEditTxFeature;
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

export function useEditTxFeatureFlag({ featureKey, account, parentAccount }: Props) {
  const { enabled, params } = useFeature(featureKey) ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const isCurrencySupported = Boolean(
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId),
  );

  return {
    isEditTxEnabled: Boolean(enabled),
    isCurrencySupported,
  };
}
