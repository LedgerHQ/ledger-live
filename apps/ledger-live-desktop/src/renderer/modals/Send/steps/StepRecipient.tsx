import React, { useMemo } from "react";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import SendRecipientFields, { getFields } from "../SendRecipientFields";
import RecipientField from "../fields/RecipientField";
import { StepProps } from "../types";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";
import { MEMO_TAG_COINS } from "LLD/features/MemoTag/constants";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import {
  forceAutoFocusOnMemoFieldSelector,
  memoTagBoxVisibilitySelector,
} from "~/renderer/reducers/UI";
import MemoTagSendInfo from "LLD/features/MemoTag/components/MemoTagSendInfo";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import CheckBox from "~/renderer/components/CheckBox";
import { alwaysShowMemoTagInfoSelector } from "~/renderer/reducers/settings";
import { toggleShouldDisplayMemoTagInfo } from "~/renderer/actions/settings";
import { useFeature } from "@features/platform-feature-flags";
import { getMemoTagValueByTransactionFamily } from "LLD/features/MemoTag/utils";
import {
  getTokenExtensions,
  hasProblematicExtension,
} from "@ledgerhq/live-common/families/solana/token";
import Alert from "~/renderer/components/Alert";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLLDCoinFamily } from "~/renderer/families";
import { useNewSendFlowFeature } from "LLD/features/Send/hooks/useNewSendFlowFeature";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

const openSplTokenExtensionsArticle = () => openURL(urls.solana.splTokenExtensions);

type StuckAccountAndOperation = {
  account: AccountLike;
  parentAccount: Account | undefined;
  operation: Operation;
};

type SendStepRecipientFromSelectorComponent = React.ComponentType<{
  account: Account;
  transaction: Transaction;
  onChange: (t: Transaction) => void;
}>;

const SenderErrorBanner = ({ error }: { error: Error }) => (
  <div data-testid="sender-error-container">
    <ErrorBanner dataTestId="sender-error" error={error} />
  </div>
);

const SplProblematicExtensionWarning = ({ account }: { account: AccountLike }) => {
  const extensions = getTokenExtensions(account);
  if (!extensions || !hasProblematicExtension(extensions)) return null;

  return (
    <Alert data-testid="spl-2022-problematic-extension" type="warning" small={true}>
      <Trans i18nKey="send.steps.details.splExtensionsWarning">
        <Link type="color" onClick={openSplTokenExtensionsArticle} />
      </Trans>
    </Alert>
  );
};

type RecipientFormFieldsProps = {
  t: StepProps["t"];
  mainAccount: Account;
  parentAccount: StepProps["parentAccount"];
  transaction: Transaction;
  status: TransactionStatus;
  openedFromAccount: boolean;
  forceAutoFocusOnMemoField: boolean;
  onChangeTransaction: StepProps["onChangeTransaction"];
  maybeRecipient?: string;
  onResetMaybeRecipient: () => void;
};

const RecipientFormFields = ({
  t,
  mainAccount,
  parentAccount,
  transaction,
  status,
  openedFromAccount,
  forceAutoFocusOnMemoField,
  onChangeTransaction,
  maybeRecipient,
  onResetMaybeRecipient,
}: RecipientFormFieldsProps) => (
  <>
    <RecipientField
      status={status}
      autoFocus={openedFromAccount && !forceAutoFocusOnMemoField}
      account={mainAccount}
      transaction={transaction}
      onChangeTransaction={onChangeTransaction}
      t={t}
      initValue={maybeRecipient}
      resetInitValue={onResetMaybeRecipient}
    />
    <SendRecipientFields
      account={mainAccount}
      parentAccount={parentAccount}
      status={status}
      transaction={transaction}
      onChange={onChangeTransaction}
      autoFocus={forceAutoFocusOnMemoField}
    />
  </>
);

type RecipientStepContentProps = {
  t: StepProps["t"];
  account: AccountLike;
  mainAccount: Account;
  parentAccount: StepProps["parentAccount"];
  transaction: StepProps["transaction"];
  status: TransactionStatus;
  error: StepProps["error"];
  openedFromAccount: boolean;
  forceAutoFocusOnMemoField: boolean;
  accountFilter: (acc: Account) => boolean;
  stuckAccountAndOperation: StuckAccountAndOperation | undefined;
  SendStepRecipientFromSelector?: SendStepRecipientFromSelectorComponent;
  onChangeAccount: StepProps["onChangeAccount"];
  onChangeTransaction: StepProps["onChangeTransaction"];
  maybeRecipient?: string;
  onResetMaybeRecipient: () => void;
};

const RecipientStepContent = ({
  t,
  account,
  mainAccount,
  parentAccount,
  transaction,
  status,
  error,
  openedFromAccount,
  forceAutoFocusOnMemoField,
  accountFilter,
  stuckAccountAndOperation,
  SendStepRecipientFromSelector,
  onChangeAccount,
  onChangeTransaction,
  maybeRecipient,
  onResetMaybeRecipient,
}: RecipientStepContentProps) => (
  <>
    <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
    {error ? <ErrorBanner error={error} /> : null}
    {status.errors?.sender ? <SenderErrorBanner error={status.errors.sender} /> : null}

    <Box flow={1}>
      <Label>{t("send.steps.details.selectAccountDebit")}</Label>
      <SelectAccount
        id="account-debit-placeholder"
        withSubAccounts
        enforceHideEmptySubAccounts
        autoFocus={!openedFromAccount && !forceAutoFocusOnMemoField}
        onChange={onChangeAccount}
        value={account}
        filter={accountFilter}
      />
    </Box>

    {SendStepRecipientFromSelector && transaction ? (
      <SendStepRecipientFromSelector
        account={mainAccount}
        transaction={transaction}
        onChange={onChangeTransaction}
      />
    ) : null}

    <SplProblematicExtensionWarning account={account} />
    {stuckAccountAndOperation ? (
      <EditOperationPanel
        operation={stuckAccountAndOperation.operation}
        account={stuckAccountAndOperation.account}
        parentAccount={stuckAccountAndOperation.parentAccount}
      />
    ) : null}
    <StepRecipientSeparator />
    {transaction ? (
      <RecipientFormFields
        t={t}
        mainAccount={mainAccount}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        openedFromAccount={openedFromAccount}
        forceAutoFocusOnMemoField={forceAutoFocusOnMemoField}
        onChangeTransaction={onChangeTransaction}
        maybeRecipient={maybeRecipient}
        onResetMaybeRecipient={onResetMaybeRecipient}
      />
    ) : null}
  </>
);

export const DefaultStepRecipient = ({
  t,
  account,
  parentAccount,
  openedFromAccount,
  transaction,
  onChangeAccount,
  onChangeTransaction,
  error,
  status,
  maybeRecipient,
  onResetMaybeRecipient,
  currencyName,
}: StepProps) => {
  const isMemoTagBoxVisibile = useSelector(memoTagBoxVisibilitySelector);
  const forceAutoFocusOnMemoField = useSelector(forceAutoFocusOnMemoFieldSelector);
  const lldMemoTag = useFeature("lldMemoTag");
  const { isEnabledForFamily } = useNewSendFlowFeature();
  const bridge = useAccountBridgeOrNull(account ?? null, parentAccount);
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const specific = useLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    mainAccount?.currency.family,
  );

  const accountFilter = useMemo(
    () => (acc: Account) => {
      const family = acc.currency.family;
      return !isEnabledForFamily(family, acc.currency.id);
    },
    [isEnabledForFamily],
  );

  if (!status || !account || !mainAccount) return null;

  // check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const stuckAccountAndOperation = bridge?.getStuckAccountAndOperation(account, parentAccount);

  return (
    <Box flow={4}>
      <TrackPage category="Send Flow" name="Step Recipient" currencyName={currencyName} />
      {isMemoTagBoxVisibile && lldMemoTag?.enabled ? (
        <MemoTagSendInfo />
      ) : (
        <RecipientStepContent
          t={t}
          account={account}
          mainAccount={mainAccount}
          parentAccount={parentAccount}
          transaction={transaction}
          status={status}
          error={error}
          openedFromAccount={openedFromAccount}
          forceAutoFocusOnMemoField={forceAutoFocusOnMemoField}
          accountFilter={accountFilter}
          stuckAccountAndOperation={stuckAccountAndOperation}
          SendStepRecipientFromSelector={specific?.SendStepRecipientFromSelector}
          onChangeAccount={onChangeAccount}
          onChangeTransaction={onChangeTransaction}
          maybeRecipient={maybeRecipient}
          onResetMaybeRecipient={onResetMaybeRecipient}
        />
      )}
    </Box>
  );
};

const StepRecipient = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const specific = useLLDCoinFamily(mainAccount?.currency.family);

  if (!account) {
    return null;
  }

  const Component = specific?.SendStepRecipient ?? DefaultStepRecipient;

  return <Component {...props} />;
};

export const StepRecipientFooter = ({
  t,
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
  transaction,
}: StepProps) => {
  const dispatch = useDispatch();
  const lldMemoTag = useFeature("lldMemoTag");
  const { errors } = status;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const specific = useLLDCoinFamily(mainAccount?.currency.family);
  const fields = ["recipient"].concat(
    mainAccount ? getFields(mainAccount, lldMemoTag?.enabled, specific?.sendRecipientFields) : [],
  );
  const hasFieldError = Object.keys(errors).some(name => fields.includes(name));
  const customValidationSuccess = specific?.sendRecipientCanNext?.(status) ?? true;
  const canNext =
    !bridgePending && !hasFieldError && customValidationSuccess && !status.errors.sender;
  const isMemoTagBoxVisibile = useSelector(memoTagBoxVisibilitySelector);
  const alwaysShowMemoTagInfo = useSelector(alwaysShowMemoTagInfoSelector);

  const handleOnNext = async () => {
    if (
      transaction &&
      lldMemoTag?.enabled &&
      typeof transaction.family === "string" &&
      MEMO_TAG_COINS.includes(transaction.family) &&
      alwaysShowMemoTagInfo
    ) {
      const memoTagValue = getMemoTagValueByTransactionFamily(transaction);
      if (!memoTagValue) {
        dispatch(
          setMemoTagInfoBoxDisplay({
            isMemoTagBoxVisible: true,
          }),
        );
        return;
      }
    }
    transitionTo("amount");
  };

  const handleOnRefuseAddTag = () => {
    dispatch(setMemoTagInfoBoxDisplay({ isMemoTagBoxVisible: false }));
    transitionTo("amount");
  };

  const handleOnAddTag = () => {
    dispatch(
      setMemoTagInfoBoxDisplay({
        isMemoTagBoxVisible: false,
        forceAutoFocusOnMemoField: true,
      }),
    );
  };

  const handleOnCheckboxChange = () => {
    dispatch(toggleShouldDisplayMemoTagInfo(!alwaysShowMemoTagInfo));
  };

  return isMemoTagBoxVisibile && lldMemoTag?.enabled ? (
    <Flex justifyContent="space-between" width="100%">
      <Flex alignItems="center">
        <CheckBox isChecked={!alwaysShowMemoTagInfo} onChange={handleOnCheckboxChange} />
        <Text
          ff="Inter|SemiBold"
          fontSize={4}
          style={{
            marginLeft: 8,
            overflowWrap: "break-word",
            flex: 1,
          }}
        >
          {t("send.info.needMemoTag.checkbox.label")}
        </Text>
      </Flex>
      <Flex columnGap={2}>
        <Button onClick={handleOnRefuseAddTag}>{t("send.info.needMemoTag.cta.not.addTag")}</Button>
        <Button primary onClick={handleOnAddTag}>
          {t("send.info.needMemoTag.cta.addTag")}
        </Button>
      </Flex>
    </Flex>
  ) : (
    <Button
      id={"send-recipient-continue-button"}
      isLoading={bridgePending}
      primary
      disabled={!canNext}
      onClick={handleOnNext}
    >
      {t("common.continue")}
    </Button>
  );
};

export default StepRecipient;
