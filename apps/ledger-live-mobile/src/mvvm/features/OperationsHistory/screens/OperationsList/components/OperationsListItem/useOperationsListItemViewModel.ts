import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { getOperationAmountNumber, isConfirmedOperation } from "@ledgerhq/live-common/operation";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useCurrencySettingsForAccount } from "LLM/hooks/useCurrencySettingsForAccount";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Params = {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | undefined;
};

type AmountColorType = "base" | "success" | "warning";

export function useOperationsListItemViewModel({ operation, account, parentAccount }: Params) {
  const navigation = useNavigation<BaseNavigation>();

  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const currencySettings = useCurrencySettingsForAccount(mainAccount);
  const amount = getOperationAmountNumber(operation);
  const isOptimistic = operation.blockHeight === null;
  const isConfirmed = isConfirmedOperation(
    operation,
    mainAccount,
    currencySettings.confirmationsNb,
  );

  const operationType = operation.type;
  const isOutgoing = amount.isNegative();
  const isASendOrReceive = operationType === "IN" || operationType === "OUT";

  const address = isOutgoing ? operation.recipients[0] : operation.senders[0];
  const formattedAddress = address
    ? formatAddress(address, { prefixLength: 6, suffixLength: 4 })
    : "";

  let amountColor: AmountColorType = "warning";
  if (isOutgoing) amountColor = "base";
  else if (isConfirmed) amountColor = "success";

  const onPress = useCallback(() => {
    track("transaction_clicked", { transaction: operation.type });
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id,
      operation,
      key: operation.id,
    });
  }, [operation, account.id, parentAccount?.id, navigation]);

  return {
    operationType,
    isOutgoing,
    isASendOrReceive,
    formattedAddress,
    currency,
    unit,
    amount,
    amountColor,
    isOptimistic,
    onPress,
  };
}
