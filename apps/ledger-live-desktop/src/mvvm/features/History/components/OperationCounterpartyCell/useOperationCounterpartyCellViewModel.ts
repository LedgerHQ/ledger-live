import { getCurrencyForAccount } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAddressDisplay } from "LLD/hooks/useAddressDisplay";
import type { OperationTableItem } from "../../types";

export function useOperationCounterpartyCellViewModel(item: OperationTableItem) {
  const { address, account, parentAccount } = item;
  const mainAccount = getMainAccount(account, parentAccount);
  const cryptoOrToken = getCurrencyForAccount(account);
  const currencyId =
    cryptoOrToken.type === "TokenCurrency" ? cryptoOrToken.parentCurrencyId : cryptoOrToken.id;

  const { displayName, contactAddressLabel } = useAddressDisplay(
    address || mainAccount.freshAddress,
    currencyId,
  );

  return { displayName, contactAddressLabel };
}
