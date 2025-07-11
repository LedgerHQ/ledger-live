import React from "react";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SelectAccount from "~/renderer/components/SelectAccount";
import SelectNFT from "~/renderer/screens/nft/Send/SelectNFT";
import SendRecipientFields, { getFields } from "../SendRecipientFields";
import RecipientField from "../fields/RecipientField";
import { StepProps } from "../types";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { Account } from "@ledgerhq/types-live";
import EditOperationPanel from "~/renderer/components/OperationsList/EditOperationPanel";
import { MEMO_TAG_COINS } from "LLD/features/MemoTag/constants";
import { useDispatch, useSelector } from "react-redux";
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
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getMemoTagValueByTransactionFamily } from "LLD/features/MemoTag/utils";
import {
  getTokenExtensions,
  hasProblematicExtension,
} from "@ledgerhq/live-common/families/solana/token";
import Alert from "~/renderer/components/Alert";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

const openSplTokenExtensionsArticle = () => openURL(urls.solana.splTokenExtensions);

const StepRecipient = ({
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
  maybeNFTId,
  currencyName,
  isNFTSend,
  onChangeNFT,
  maybeNFTCollection,
}: StepProps) => {
  const isMemoTagBoxVisibile = useSelector(memoTagBoxVisibilitySelector);
  const forceAutoFocusOnMemoField = useSelector(forceAutoFocusOnMemoFieldSelector);
  const lldMemoTag = useFeature("lldMemoTag");

  if (!status || !account) return null;

  const mainAccount = getMainAccount(account, parentAccount);
  const extensions = getTokenExtensions(account);

  // check if there is a stuck transaction. If so, display a warning panel with "speed up or cancel" button
  const stuckAccountAndOperation = getStuckAccountAndOperation(account, parentAccount);

  return (
    <Box flow={4}>
      <TrackPage
        category="Send Flow"
        name="Step Recipient"
        currencyName={currencyName}
        isNFTSend={isNFTSend}
      />
      {isMemoTagBoxVisibile && lldMemoTag?.enabled ? (
        <MemoTagSendInfo />
      ) : (
        <>
          {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
          {error ? <ErrorBanner error={error} /> : null}
          {status.errors && status.errors.sender ? (
            <div data-testid="sender-error-container">
              <ErrorBanner dataTestId="sender-error" error={status.errors.sender} />
            </div>
          ) : null}
          {isNFTSend ? (
            <Box flow={1}>
              <Label>{t("send.steps.recipient.nftRecipient")}</Label>
              {account && (
                <SelectNFT
                  onSelect={onChangeNFT}
                  maybeNFTId={maybeNFTId}
                  maybeNFTCollection={maybeNFTCollection}
                  account={account as Account}
                />
              )}
            </Box>
          ) : (
            <Box flow={1}>
              <Label>{t("send.steps.details.selectAccountDebit")}</Label>
              <SelectAccount
                id="account-debit-placeholder"
                withSubAccounts
                enforceHideEmptySubAccounts
                autoFocus={!openedFromAccount && !forceAutoFocusOnMemoField}
                onChange={onChangeAccount}
                value={account}
              />
            </Box>
          )}
          {extensions && hasProblematicExtension(extensions) ? (
            <Alert data-testid="spl-2022-problematic-extension" type="warning" small={true}>
              <Trans i18nKey="send.steps.details.splExtensionsWarning">
                <Link type="color" onClick={openSplTokenExtensionsArticle} />
              </Trans>
            </Alert>
          ) : null}
          {stuckAccountAndOperation ? (
            <EditOperationPanel
              operation={stuckAccountAndOperation.operation}
              account={stuckAccountAndOperation.account}
              parentAccount={stuckAccountAndOperation.parentAccount}
            />
          ) : null}
          <StepRecipientSeparator />
          {account && transaction && mainAccount && (
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
          )}
        </>
      )}
    </Box>
  );
};

export const StepRecipientFooter = ({
  t,
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
  shouldSkipAmount,
  transaction,
}: StepProps) => {
  const dispatch = useDispatch();
  const lldMemoTag = useFeature("lldMemoTag");
  const { errors } = status;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const isTerminated = mainAccount && mainAccount.currency.terminated;
  const fields = ["recipient"].concat(
    mainAccount ? getFields(mainAccount, lldMemoTag?.enabled) : [],
  );
  const hasFieldError = Object.keys(errors).some(name => fields.includes(name));
  const canNext = !bridgePending && !hasFieldError && !isTerminated && !status.errors.sender;
  const isMemoTagBoxVisibile = useSelector(memoTagBoxVisibilitySelector);
  const alwaysShowMemoTagInfo = useSelector(alwaysShowMemoTagInfoSelector);

  const handleOnNext = async () => {
    const memoTagValue = getMemoTagValueByTransactionFamily(transaction as Transaction);
    if (
      lldMemoTag?.enabled &&
      !memoTagValue &&
      MEMO_TAG_COINS.includes(transaction?.family as string) &&
      alwaysShowMemoTagInfo
    ) {
      dispatch(
        setMemoTagInfoBoxDisplay({
          isMemoTagBoxVisible: true,
        }),
      );
      return;
    }
    if (shouldSkipAmount) {
      transitionTo("summary");
    } else {
      transitionTo("amount");
    }
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
        <Button secondary onClick={handleOnRefuseAddTag}>
          {t("send.info.needMemoTag.cta.not.addTag")}
        </Button>
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
