import { SendFlowStep, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { t } from "i18next";
import { useMemo, useCallback } from "react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";
import {
  SendFlowBusinessContext,
  useSendFlowActions,
  useSendFlowData,
} from "../context/SendFlowContext";
import { SendStepConfig } from "../types";
import BigNumber from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useContactResolution } from "~/renderer/contacts/useDisplayAddress";
import type { ContactBadgeKind } from "~/renderer/contacts/ContactBadge";

/**
 * What to render as the inline avatar inside the read-only "To:" input on
 * the Amount step (Figma 14442:16458): the contact's photo/initials when
 * the recipient is an address-book contact, the crypto icon when it's one
 * of the user's own accounts, nothing for a raw address.
 */
export type RecipientVisual =
  | { type: "contact"; name: string }
  | { type: "account"; currencyId: string; ticker: string }
  | null;

type UseSendHeaderModelParams = Readonly<{
  availableText: string;
  resetViewState: () => void;
}>;
type UseSendHeaderModelResult = Readonly<{
  addressInputValue: string | undefined;
  descriptionText: string | undefined;
  handleBack: () => void;
  handleRecipientInputClick: () => void;
  showBackButton: boolean;
  showRecipientInput: boolean;
  showMemoControls: boolean;
  title: string | undefined;
  transactionErrorName: string | undefined;
  transactionError: Error | undefined;
  recipientContactKind: ContactBadgeKind | undefined;
  fromContactKind: ContactBadgeKind | undefined;
  recipientChainId: number | undefined;
  recipientVisual: RecipientVisual;
}>;

export function useSendHeaderModel({
  availableText,
  resetViewState,
}: UseSendHeaderModelParams): UseSendHeaderModelResult {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch, isRecipientAddressComplete } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();

  const currencyName = state.account.currency?.ticker ?? "";
  const accountName = useMaybeAccountName(state.account.account ?? undefined);

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig;
  const showRecipientInput = currentStepConfig?.addressInput ?? false;
  const showMemoControls = Boolean(
    showRecipientInput &&
      uiConfig.hasMemo &&
      recipientSearch.value.length > 0 &&
      isRecipientAddressComplete,
  );

  const backTarget = currentStepConfig?.backTarget;

  const showBackButton = navigation.canGoBack();

  const showTitle = currentStepConfig?.showTitle !== false;
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const recipientDisplayAddress = useMemo(
    () => getRecipientDisplayValue(state.recipient),
    [state.recipient],
  );
  const currency = state.account.currency;
  const recipientChainId =
    currency?.type === "CryptoCurrency"
      ? currency.ethereumLikeInfo?.chainId
      : currency?.type === "TokenCurrency"
        ? currency.parentCurrency.ethereumLikeInfo?.chainId
        : undefined;
  // recipientDisplayAddress is the truncated form (0xabc…def01) and would
  // never match a full stored address. Resolve against the full address —
  // committed (state.recipient.address) or, while still typing on the
  // Recipient step, the search input.
  const fullRecipientAddress = state.recipient?.address || recipientSearch.value || undefined;
  const recipientResolution = useContactResolution(fullRecipientAddress, recipientChainId);
  // The sending account's address (for resolution against Ledger-account entries).
  // TokenAccounts ride on a parent Account; only Accounts expose `freshAddress`.
  const fromAddress =
    state.account.account && "freshAddress" in state.account.account
      ? state.account.account.freshAddress
      : undefined;
  const fromResolution = useContactResolution(fromAddress, recipientChainId);

  // The recipient resolved to one of the user's own Ledger Live accounts —
  // drives both the crypto-icon avatar and the displayed account name on
  // the Amount step.
  const allAccounts = useSelector(accountsSelector);
  const matchedOwnAccount = useMemo(() => {
    if (!fullRecipientAddress) return undefined;
    const target = fullRecipientAddress.toLowerCase();
    return allAccounts.find(acc => acc.freshAddress.toLowerCase() === target);
  }, [allAccounts, fullRecipientAddress]);
  const matchedOwnAccountName = useMaybeAccountName(matchedOwnAccount);

  // The decorated recipient shown on later steps: the OWN account's name
  // when sending to one of the user's accounts, otherwise the contact name
  // if we resolved one, otherwise the truncated address as before. The
  // From account name stays as whatever Ledger Live has on file, and the
  // on-device-registered identity is signalled by the `fromContactKind`
  // badge alone.
  const decoratedRecipient =
    (matchedOwnAccount && matchedOwnAccountName) ||
    recipientResolution?.name ||
    recipientDisplayAddress;

  // Inline avatar for the Amount step's "To:" input. Own accounts win over
  // contacts (same precedence as `resolveContact`): an app account match
  // carries its own currency for the icon; a device-registered name with no
  // app account falls back to the selected chain's main currency.
  const recipientVisual: RecipientVisual = useMemo(() => {
    if (!fullRecipientAddress) return null;
    if (matchedOwnAccount) {
      return {
        type: "account",
        currencyId: matchedOwnAccount.currency.id,
        ticker: matchedOwnAccount.currency.ticker,
      };
    }
    if (recipientResolution?.kind === "ledgerAccount" && currency) {
      const mainCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
      return { type: "account", currencyId: mainCurrency.id, ticker: mainCurrency.ticker };
    }
    if (recipientResolution?.kind === "external") {
      return { type: "contact", name: recipientResolution.name };
    }
    return null;
  }, [fullRecipientAddress, matchedOwnAccount, recipientResolution, currency]);

  const accountSummary = useMemo(() => {
    if (accountName && availableText) return `${accountName} · ${availableText}`;
    return accountName || availableText || "";
  }, [accountName, availableText]);

  const titleKey = currentStepConfig?.titleKey ?? "newSendFlow.title";
  const showAvailable = currentStepConfig?.showAvailable ?? true;

  const title = showTitle ? t(titleKey, { currency: currencyName }) : "";

  const descriptionText = showTitle && showAvailable && accountSummary ? accountSummary : "";

  const handleBack = useCallback(() => {
    // Per-step state cleanup that runs regardless of whether navigation uses backTarget
    // or goToPreviousStep, so floating steps and regular steps are treated uniformly
    if (currentStep === SEND_FLOW_STEP.AMOUNT) {
      // Reset amount-related fields so they don't persist when the screen remounts
      transaction.updateTransaction(tx => ({
        ...tx,
        amount: new BigNumber(0),
        useAllAmount: false,
        feesStrategy: null,
      }));
      resetViewState();
    } else if (currentStep === SEND_FLOW_STEP.COIN_CONTROL) {
      // Reset UTXO exclusions so the selection doesn't bleed into the next visit
      transaction.updateTransaction(tx => {
        if (!("utxoStrategy" in tx)) return tx;
        return { ...tx, utxoStrategy: { ...tx.utxoStrategy, excludeUTXOs: [] } };
      });
    }

    if (backTarget) {
      navigation.goToStep(backTarget);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [backTarget, close, currentStep, navigation, resetViewState, transaction]);

  const addressInputValue = useMemo(() => {
    if (isRecipientStep) return recipientSearch.value;
    if (isAmountStep) return decoratedRecipient;
    return recipientSearch.value;
  }, [isRecipientStep, isAmountStep, recipientSearch.value, decoratedRecipient]);

  const handleRecipientInputClick = useCallback(() => {
    if (!isAmountStep) return;

    const prefillValue = getRecipientSearchPrefillValue(state.recipient);
    if (prefillValue) {
      recipientSearch.setValue(prefillValue);
    }

    handleBack();
  }, [handleBack, isAmountStep, recipientSearch, state.recipient]);

  const transactionError = state.transaction.status?.errors?.transaction;
  const transactionErrorName = transactionError?.name;

  return {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError: transactionError instanceof Error ? transactionError : undefined,
    recipientContactKind: recipientResolution?.kind,
    fromContactKind: fromResolution?.kind === "ledgerAccount" ? "ledgerAccount" : undefined,
    recipientChainId,
    recipientVisual,
  };
}
