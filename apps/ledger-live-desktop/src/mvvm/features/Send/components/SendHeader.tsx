import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AddressInput, BaseInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { InitialsAvatar } from "~/mvvm/features/Contacts/Management/components/InitialsAvatar";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { useRecipientView } from "../context/RecipientViewContext";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  SEND_FLOW_STEP,
  type SendFlowBusinessContext,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { useAvailableBalance } from "../hooks/useAvailableBalance";
import { useSendHeaderModel } from "../hooks/useSendHeaderModel";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { SkipMemoSection } from "../screens/Recipient/components/Memo/SkipMemoSection";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import type { SendStepConfig } from "../types";
import { RecipientPicker } from "./RecipientPicker";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();
  const availableText = useAvailableBalance(state.account.account);

  const { navigation, currentStep } = wizard;
  const currencyId = state.account.currency?.id;
  const { view: recipientView, setView: setRecipientView } = useRecipientView();

  // Main (sending) account id — "My accounts" must not list the source.
  const currentMainAccountId = state.account.account
    ? getMainAccount(state.account.account, state.account.parentAccount ?? undefined).id
    : undefined;

  // Picking a contact / own account is an explicit choice — commit the
  // recipient and jump straight to the Amount step, no matched-row
  // confirmation click. The search input is CLEARED (the committed
  // recipient drives the Amount step's display), so going back from
  // Amount lands on the clean selection state, not the matched-address
  // verification. Memo currencies are the exception: the inline memo
  // controls live on this step, so there we only fill the input.
  const handlePickRecipient = React.useCallback(
    (address: string) => {
      if (uiConfig.hasMemo) {
        recipientSearch.setValue(address);
        return;
      }
      recipientSearch.clear();
      transaction.setRecipient({ ...state.recipient, address });
      navigation.goToNextStep();
    },
    [recipientSearch, uiConfig.hasMemo, transaction, state.recipient, navigation],
  );

  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  const memoDefaultOption = useMemo(() => {
    return sendFeatures.getMemoDefaultOption(state.account.currency ?? undefined);
  }, [state.account.currency]);

  const memoTypeOptions = useMemo(() => {
    return uiConfig.memoOptions ?? [];
  }, [uiConfig]);

  const {
    hasMemoTypeOptions,
    memo,
    onMemoTypeChange,
    showMemoValueInput,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
    resetViewState,
  } = useRecipientMemo({
    hasMemo: uiConfig.hasMemo,
    memoDefaultOption,
    memoType: uiConfig.memoType,
    memoTypeOptions,
    onMemoChange: memo => {
      const address = state.recipient?.address ?? recipientSearch.value;
      transaction.setRecipient({ ...state.recipient, address, memo });
    },
    onMemoSkip: () => {
      track("button_clicked", {
        button: "skip memo",
        page: "step recipient",
        ...sendFlowTrackingProperties,
      });
      navigation.goToNextStep();
    },
    resetKey: `${state.account.account?.id ?? ""}|${currencyId ?? ""}|${
      recipientSearch.value.length === 0 ? "empty" : "filled"
    }`,
  });

  const {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError,
    recipientChainId,
    recipientVisual,
  } = useSendHeaderModel({ availableText, resetViewState });

  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const recipientInputContent = useMemo(() => {
    if (!showRecipientInput) return null;

    if (isAmountStep) {
      // Inline avatar before the recipient name (Figma 14442:16458) —
      // contact photo/initials, or the crypto icon for an own account.
      const recipientAvatar =
        recipientVisual?.type === "contact" ? (
          <InitialsAvatar name={recipientVisual.name} size="xs" />
        ) : recipientVisual?.type === "account" ? (
          <SquaredCryptoIcon
            size={24}
            ledgerId={recipientVisual.currencyId}
            ticker={recipientVisual.ticker}
          />
        ) : null;

      return (
        <div className="-mt-12 mb-24 px-24">
          <div className="relative flex items-center gap-8">
            {/* `AddressInput` only accepts a string prefix, so to slot the
                avatar between "To:" and the name we use the underlying
                `BaseInput` directly with a composite prefix node — the
                "To:" span carries AddressInput's exact classes. */}
            <BaseInput
              className="w-full"
              value={addressInputValue}
              hideClearButton
              prefix={
                <span className="flex items-center gap-8">
                  <span aria-hidden="true" className="body-1 text-nowrap text-base">
                    {t("newSendFlow.toPrefix")}
                  </span>
                  {recipientAvatar}
                </span>
              }
            />
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Edit recipient"
              data-testid="send-edit-recipient-button"
              onClick={handleRecipientInputClick}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-12 flex items-center gap-8 px-24">
          <AddressInput
            className="w-full"
            id="send-recipient-input"
            data-testid="send-recipient-input"
            autoFocus
            value={addressInputValue}
            onChange={e => recipientSearch.setValue(e.target.value)}
            onClear={recipientSearch.clear}
            placeholder={
              uiConfig.recipientSupportsDomain
                ? t("newSendFlow.placeholder")
                : t("newSendFlow.placeholderNoENS")
            }
          />
        </div>
        <RecipientPicker
          query={recipientSearch.value}
          chainId={recipientChainId}
          currency={state.account.currency}
          currentMainAccountId={currentMainAccountId}
          onSelect={s => handlePickRecipient(s.addressHex)}
          onSelectAccount={s => handlePickRecipient(s.address)}
          onShowAllContacts={() => setRecipientView("contacts")}
          onShowAllAccounts={() => setRecipientView("accounts")}
        />
        {showMemoControls && currencyId ? (
          <div className="px-24">
            <div className="flex flex-col gap-12">
              {hasMemoTypeOptions && (
                <MemoTypeSelect
                  currencyId={currencyId}
                  options={memoTypeOptions}
                  value={memo.type}
                  onChange={onMemoTypeChange}
                />
              )}

              {showMemoValueInput ? (
                <MemoValueInput
                  currencyId={currencyId}
                  value={memo.value}
                  maxLength={uiConfig.memoMaxLength}
                  memoType={uiConfig.memoType}
                  memoMaxValue={uiConfig.memoMaxValue}
                  transactionError={transactionError}
                  transactionErrorName={transactionErrorName}
                  onChange={onMemoValueChange}
                />
              ) : null}
            </div>

            {showSkipMemo && (
              <SkipMemoSection
                currencyId={currencyId}
                state={skipMemoState}
                onRequestConfirm={onSkipMemoRequestConfirm}
                onCancelConfirm={onSkipMemoCancelConfirm}
                onConfirm={onSkipMemoConfirm}
              />
            )}
          </div>
        ) : null}
      </>
    );
  }, [
    showRecipientInput,
    isAmountStep,
    addressInputValue,
    recipientSearch,
    uiConfig.recipientSupportsDomain,
    uiConfig.memoMaxLength,
    uiConfig.memoType,
    uiConfig.memoMaxValue,
    t,
    showMemoControls,
    currencyId,
    hasMemoTypeOptions,
    memoTypeOptions,
    memo.type,
    memo.value,
    onMemoTypeChange,
    showMemoValueInput,
    transactionError,
    transactionErrorName,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
    handleRecipientInputClick,
    recipientChainId,
    state.account.currency,
    currentMainAccountId,
    setRecipientView,
    handlePickRecipient,
    recipientVisual,
  ]);

  // Full-list sub-views (Figma 14437:40767 / 43129): the header collapses to
  // back-arrow + "Contacts" / "My accounts" + close, and the address input /
  // previews give way to the list body rendered by RecipientScreen.
  if (currentStep === SEND_FLOW_STEP.RECIPIENT && recipientView !== "default") {
    return (
      <div className="flex flex-col">
        <div data-testid="send-dialog-header">
          <DialogHeader
            density="compact"
            title={
              recipientView === "contacts"
                ? t("newSendFlow.picker.contacts")
                : t("newSendFlow.picker.myAccounts")
            }
            onBack={() => setRecipientView("default")}
            onClose={close}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div data-testid="send-dialog-header">
        <DialogHeader
          density="compact"
          title={title}
          description={descriptionText || undefined}
          onBack={showBackButton ? handleBack : undefined}
          onClose={close}
        />
      </div>
      {recipientInputContent}
    </div>
  );
}
