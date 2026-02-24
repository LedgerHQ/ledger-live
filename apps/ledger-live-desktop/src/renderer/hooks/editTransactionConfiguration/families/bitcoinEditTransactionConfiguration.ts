import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Account, Operation } from "@ledgerhq/types-live";

export function getSupportedFamily() {
  return "bitcoin";
}

export function useGetConfiguration(mainAccount: Account, operation: Operation) {
  const { enabled: isEditBitcoinTxEnabled, params: bitcoinParams } =
    useFeature("editBitcoinTx") ?? {};

  const isPending = !operation.blockHeight;
  if (!isPending) {
    return null;
  }

  if (
    isEditBitcoinTxEnabled &&
    bitcoinParams?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId)
  ) {
    return {
      modalName: "MODAL_BITCOIN_EDIT_TRANSACTION" as const,
      isSupported: true,
    };
  }

  return null;
}
