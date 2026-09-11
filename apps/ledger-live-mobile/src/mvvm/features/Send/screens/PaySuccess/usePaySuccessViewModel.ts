import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import type { PaySuccessProps } from "@features/flow-pay-contact";
import { getRecipientHeaderPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useContactsFeature } from "@features/platform-contacts";
import { selectContacts, ContactIdSchema } from "@domain/entity-contact";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../types";

export function usePaySuccessViewModel(): PaySuccessProps {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { state } = useSendFlowData();
  const { close } = useSendFlowActions();
  const locale = useSelector(localeSelector);
  const contacts = useSelector(selectContacts);
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("mobile");

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const currency = state.account.currency;

  const recipient = useMemo(() => {
    const signedAddress = state.transaction.transaction?.recipient;
    if (typeof signedAddress === "string" && signedAddress.length > 0) {
      return { address: signedAddress };
    }
    return state.recipient;
  }, [state.recipient, state.transaction.transaction?.recipient]);

  const recipientHeader = useMemo(
    () =>
      getRecipientHeaderPresentation({
        recipient,
        contacts,
        currencyId: currency?.id,
        isContactsFeatureEnabled,
      }),
    [contacts, currency?.id, isContactsFeatureEnabled, recipient],
  );

  const amountUnit = useMaybeAccountUnit(account ?? undefined) ?? currency?.units[0];
  const amountFormatted = useMemo(() => {
    if (!amountUnit) return "";
    const amount = state.transaction.transaction?.amount ?? new BigNumber(0);
    return formatCurrencyUnit(amountUnit, amount, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [amountUnit, locale, state.transaction.transaction]);

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation =
    optimisticOperation?.subOperations?.find(op => op.accountId === account?.id) ??
    optimisticOperation ??
    null;

  const onViewTransaction = useCallback(() => {
    if (!account || !concernedOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id ?? undefined,
      operation: concernedOperation,
    });
  }, [account, concernedOperation, parentAccount, navigation]);

  const matchedRecipient = recipientHeader.contact
    ? {
        id: ContactIdSchema.parse(recipientHeader.contact.id),
        name: recipientHeader.contact.name,
      }
    : undefined;

  return {
    recipient: matchedRecipient,
    recipientLabel: recipientHeader.label,
    amountFormatted,
    canViewTransaction: Boolean(account && concernedOperation),
    onViewTransaction,
    onClose: close,
  };
}
