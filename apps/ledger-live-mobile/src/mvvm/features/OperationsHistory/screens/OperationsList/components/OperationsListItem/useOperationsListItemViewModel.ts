import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { isOperationUnread } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useMaybeAccountName } from "~/reducers/wallet";

type Params = {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | undefined;
  accountByAddress: Map<string, AccountLike>;
  lastSeenTs: number | null;
};

type AmountColorType = "base" | "success";

export function useOperationsListItemViewModel({
  operation,
  account,
  parentAccount,
  accountByAddress,
  lastSeenTs,
}: Params) {
  const navigation = useNavigation<BaseNavigation>();

  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const amount = getOperationAmountNumber(operation);
  const hasFailed = !!operation.hasFailed;

  const isUnread = isOperationUnread(operation.date, lastSeenTs);

  const operationType = operation.type;
  const isOutgoing = amount.isNegative();
  const isASendOrReceive = operationType === "IN" || operationType === "OUT";

  const address = isOutgoing ? operation.recipients[0] : operation.senders[0];
  const formattedAddress = address
    ? formatAddress(address, { prefixLength: 6, suffixLength: 4 })
    : "";

  const counterpartyAccount = address
    ? accountByAddress.get(`${mainAccount.currency.id}:${address}`)
    : undefined;
  const counterpartyAccountName = useMaybeAccountName(counterpartyAccount);
  // For send/receive: prefer the counterparty's account name, fall back to the raw address
  const counterpartyLabel = counterpartyAccountName ?? formattedAddress;

  const amountColor: AmountColorType = isOutgoing ? "base" : "success";

  const onPress = useCallback(() => {
    track("transaction_clicked", { transaction: operation.type });
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id,
      operation,
      key: operation.id,
    });
  }, [operation, account.id, parentAccount?.id, navigation]);
  const accountName = useMaybeAccountName(account);

  return {
    accountName,
    counterpartyLabel,
    operationType,
    isOutgoing,
    isASendOrReceive,
    isUnread,
    currency,
    unit,
    amount,
    amountColor,
    hasFailed,
    onPress,
  };
}
