import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { PaySuccessProps } from "@features/flow-pay-contact";
import { getRecipientHeaderPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useContactsFeature } from "@features/platform-contacts";
import { selectContacts, ContactIdSchema } from "@domain/entity-contact";
import { useSelector } from "LLD/hooks/redux";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { localeSelector } from "~/renderer/reducers/settings";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

function formatApproximateBlockTime(seconds: number | undefined): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  return `~${Math.round(seconds / 60)} min`;
}

export function usePaySuccessViewModel(): PaySuccessProps {
  const { state } = useSendFlowData();
  const { close } = useSendFlowActions();
  const locale = useSelector(localeSelector);
  const contacts = useSelector(selectContacts);
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("desktop");

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const currency = state.account.currency;

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount ?? undefined) : null),
    [account, parentAccount],
  );
  const networkCurrency = useMemo(
    () => (mainAccount ? getAccountCurrency(mainAccount) : null),
    [mainAccount],
  );

  const recipientHeader = useMemo(
    () =>
      getRecipientHeaderPresentation({
        recipient: state.recipient,
        contacts,
        currencyId: currency?.id,
        isContactsFeatureEnabled,
      }),
    [contacts, currency?.id, isContactsFeatureEnabled, state.recipient],
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

  const fromAccountName = useMaybeAccountName(account ?? undefined) ?? "";

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation = useMemo(
    () => optimisticOperation?.subOperations?.[0] ?? optimisticOperation ?? null,
    [optimisticOperation],
  );

  const onViewTransaction = useCallback(() => {
    close();
    if (account && concernedOperation) {
      setDrawer(
        OperationDetails,
        {
          operationId: concernedOperation.id,
          accountId: account.id,
          parentId: parentAccount?.id,
        },
        { onRequestClose: () => setDrawer() },
      );
    }
  }, [account, concernedOperation, parentAccount, close]);

  const recipient = recipientHeader.contact
    ? {
        id: ContactIdSchema.parse(recipientHeader.contact.id),
        name: recipientHeader.contact.name,
        isMe: false,
      }
    : undefined;

  const networkIcon = networkCurrency
    ? { ledgerId: networkCurrency.id, ticker: networkCurrency.ticker }
    : undefined;

  const estimatedTime =
    networkCurrency?.type === "CryptoCurrency"
      ? formatApproximateBlockTime(networkCurrency.blockAvgTime)
      : undefined;

  return {
    recipient,
    recipientLabel: recipientHeader.label,
    amountFormatted,
    fromAccountName,
    networkIcon,
    estimatedTime,
    onViewTransaction,
    onClose: close,
  };
}
