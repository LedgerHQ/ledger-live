import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Account, Operation } from "@ledgerhq/types-live";

export function getSupportedFamily() {
  return "evm";
}

export function useGetConfiguration(mainAccount: Account, operation: Operation) {
  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};

  if (!operation.transactionRaw) {
    return null;
  }

  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;

  if (isEditEvmTxEnabled && isCurrencySupported) {
    return {
      modalName: "MODAL_EVM_EDIT_TRANSACTION" as const,
      isSupported: true,
    };
  }

  return null;
}
