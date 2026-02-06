import {
  findSubAccountById,
  getAccountCurrency,
  getFeesCurrency,
  getFeesUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getDefaultExplorerView,
  getTransactionExplorer as getDefaultTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  findOperationInAccount,
  getOperationAmountNumber,
  getOperationConfirmationDisplayableNumber,
  isConfirmedOperation,
  isEditableOperation,
  isStuckOperation,
} from "@ledgerhq/live-common/operation";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, Operation, OperationType } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import invariant from "invariant";
import uniq from "lodash/uniq";
import React, { Component, useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import CounterValue from "~/renderer/components/CounterValue";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import FakeLink from "~/renderer/components/FakeLink";
import FormattedVal from "~/renderer/components/FormattedVal";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import Link from "~/renderer/components/Link";
import LinkHelp from "~/renderer/components/LinkHelp";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import ConfirmationCheck from "~/renderer/components/OperationsList/ConfirmationCheck";
import OperationComponent from "~/renderer/components/OperationsList/Operation";
import Text, { TextProps } from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import { getLLDCoinFamily } from "~/renderer/families";
import IconChevronRight from "~/renderer/icons/ChevronRight";
import IconExternalLink from "~/renderer/icons/ExternalLink";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { openURL } from "~/renderer/linking";
import { State } from "~/renderer/reducers";
import { getAccountUrl } from "~/renderer/utils";
import { accountSelector } from "~/renderer/reducers/accounts";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import { getMarketColor } from "~/renderer/styles/helpers";
import { setDrawer } from "../Provider";
import AmountDetails from "./AmountDetails";
import {
  GradientHover,
  HashContainer,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsSideButton,
  OpDetailsTitle,
  Separator,
  TextEllipsis,
} from "./styledComponents";
import { dayAndHourFormat, useDateFormatted } from "~/renderer/hooks/useDateFormatter";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";
import { Divider } from "@ledgerhq/react-ui/index";

const mapStateToProps = (
  state: State,
  props: {
    operationId: string;
    accountId: string;
    parentId?: string | null;
  },
) => {
  const { operationId, accountId, parentId } = props;
  const parentAccount: Account | undefined =
    typeof parentId !== "undefined" && parentId !== null
      ? accountSelector(state, {
          accountId: parentId,
        })
      : undefined;
  let account: AccountLike | undefined | null;
  if (parentAccount && parentId === accountId) {
    account = parentAccount;
  } else if (parentAccount) {
    account = findSubAccountById(parentAccount, accountId);
  } else {
    account = accountSelector(state, {
      accountId,
    });
  }
  const mainCurrency = parentAccount
    ? parentAccount.currency
    : account && account.type !== "TokenAccount"
      ? account.currency
      : null;
  const confirmationsNb = mainCurrency
    ? confirmationsNbForCurrencySelector(state, {
        currency: mainCurrency,
      })
    : 0;
  const operation = account ? findOperationInAccount(account, operationId) : null;
  return {
    account,
    parentAccount,
    operation,
    confirmationsNb,
    onRequestBack: () => setDrawer(OperationDetails, props),
  };
};

type RestProps = {
  onClose?: () => void;
  confirmationsNb: number;
  parentOperation?: Operation;
  onRequestBack: () => void;
};

type Props = RestProps & {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | undefined;
};

type openOperationType = "goBack" | "subOperation" | "internalOperation";
const OperationD = (props: Props) => {
  const { t } = useTranslation();
  const { onClose, operation, account, parentAccount, confirmationsNb } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const mainAccount = getMainAccount(account, parentAccount);
  const { hash, date, senders, type, fee, recipients: _recipients } = operation;

  const dateFormatted = useDateFormatted(date, dayAndHourFormat);
  const uniqueSenders = uniq(senders);
  const recipients = _recipients.filter(Boolean);
  const name = useAccountName(mainAccount);
  const currency = getAccountCurrency(account);
  const mainCurrency = getAccountCurrency(mainAccount);

  const unit = useAccountUnit(account);
  const amount = getOperationAmountNumber(operation);
  const isNegative = amount.isNegative();
  const marketColor = getMarketColor({
    isNegative,
  });
  const confirmationsString = getOperationConfirmationDisplayableNumber(operation, mainAccount);
  const isConfirmed = isConfirmedOperation(operation, mainAccount, confirmationsNb);

  const cryptoCurrency = mainAccount.currency;
  const specific = cryptoCurrency ? getLLDCoinFamily(cryptoCurrency.family) : null;
  const confirmationCell = specific?.operationDetails?.confirmationCell;
  const IconElement = confirmationCell ? confirmationCell[operation.type] : null;
  const amountTooltip = specific?.operationDetails?.amountTooltip;
  const AmountTooltip = amountTooltip ? amountTooltip[operation.type] : null;

  const getURLWhatIsThis = specific?.operationDetails?.getURLWhatIsThis;
  const urlWhatIsThis = getURLWhatIsThis
    ? getURLWhatIsThis({ op: operation, currencyId: cryptoCurrency.id })
    : null;

  const getURLFeesInfo = specific?.operationDetails?.getURLFeesInfo;
  const urlFeesInfo = getURLFeesInfo
    ? getURLFeesInfo({ op: operation, currencyId: cryptoCurrency.id })
    : null;

  const getTransactionExplorer = specific?.getTransactionExplorer;
  const url = getTransactionExplorer
    ? getTransactionExplorer(getDefaultExplorerView(mainAccount.currency), operation)
    : getDefaultTransactionExplorer(getDefaultExplorerView(mainAccount.currency), operation.hash);

  const OpDetailsPostAccountSection =
    specific?.operationDetails?.OperationDetailsPostAccountSection;
  const OpDetailsExtra = specific?.operationDetails?.OperationDetailsExtra || OperationDetailsExtra;
  const OpDetailsPostAlert = specific?.operationDetails?.OperationDetailsPostAlert;
  const { hasFailed } = operation;
  const subOperations: Operation[] = useMemo(
    () => operation.subOperations || [],
    [operation.subOperations],
  );
  const internalOperations = operation.internalOperations || [];
  const isToken = (mainAccount.currency.tokenTypes || []).length > 0;
  const openOperation = useCallback(
    (type: openOperationType, operation: Operation, parentOperation?: Operation) => {
      const data = {
        operationId: operation.id,
        accountId: operation.accountId,
        parentOperation: undefined as Operation | undefined,
        parentId: undefined as string | undefined,
        onRequestBack: undefined as (() => void) | undefined,
      };
      if (["subOperation", "internalOperation"].includes(type)) {
        data.parentOperation = parentOperation;
        if (type === "subOperation") {
          data.parentId = account.id;
        }
        data.onRequestBack = parentOperation
          ? () => openOperation("goBack", parentOperation)
          : undefined;
      }
      setDrawer(OperationDetails, data);
    },
    [account],
  );
  const openAmountDetails = useCallback(() => {
    setDrawer(AmountDetails, {
      operation,
      account,
      onRequestBack: props.onRequestBack,
    });
  }, [operation, props, account]);
  const goToMainAccount = useCallback(() => {
    const url = `/account/${mainAccount.id}`;
    if (location.pathname !== url) {
      setTrackingSource("operation details");
      navigate(url);
    }
    onClose?.();
  }, [mainAccount, navigate, onClose, location]);
  const goToSubAccount = useCallback(() => {
    // For token accounts, use parentAccount.id (or account.parentId) as the parent in the URL
    const parentId =
      parentAccount?.id ||
      (account.type !== "Account" ? account.parentId : undefined) ||
      mainAccount.id;
    const url = getAccountUrl(account.id, parentId);
    if (location.pathname !== url) {
      setTrackingSource("operation details");
      navigate(url);
    }
    onClose?.();
  }, [parentAccount, account, mainAccount, navigate, onClose, location]);
  const currencyName = currency
    ? currency.type === "TokenCurrency"
      ? currency.parentCurrency.name
      : currency.name
    : undefined;

  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const { enabled: isEditBitcoinTxEnabled, params: bitcoinParams } =
    useFeature("editBitcoinTx") ?? {};
  const currencyFamily = mainAccount.currency.family;

  // Determine if transaction editing is supported and which modal to use
  const editConfig = useMemo(() => {
    // Check for Bitcoin RBF support
    if (currencyFamily === "bitcoin") {
      // RBF only works for unconfirmed (pending) transactions
      const isEditable = isEditableOperation({ account: mainAccount, operation });
      if (
        !isEditable ||
        !bitcoinParams?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId)
      ) {
        return null;
      }

      // For Bitcoin RBF, we can edit pending transactions even without transactionRaw
      // The edit modal will fetch the transaction from the blockchain using the hash
      // If transactionRaw exists, check if RBF is explicitly disabled
      if (operation.transactionRaw) {
        const bitcoinTxRaw = operation.transactionRaw as {
          family?: string;
          rbf?: boolean;
          replaceTxId?: string;
        };
        // RBF is supported if rbf is not explicitly false
        const isRbfDisabled = bitcoinTxRaw.rbf === false;

        if (isRbfDisabled) {
          return null;
        }
      }
      if (
        isEditBitcoinTxEnabled &&
        bitcoinParams?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId)
      ) {
        return {
          modalName: "MODAL_BITCOIN_EDIT_TRANSACTION" as const,
          isSupported: true,
        };
      }
      return null;
    }

    // For EVM, transactionRaw is required
    if (!operation.transactionRaw) {
      return null;
    }

    // Check for EVM support
    if (currencyFamily === "evm") {
      const isCurrencySupported =
        params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) ||
        false;
      const isEditable = isEditableOperation({ account: mainAccount, operation });

      if (isEditEvmTxEnabled && isCurrencySupported && isEditable) {
        return {
          modalName: "MODAL_EVM_EDIT_TRANSACTION" as const,
          isSupported: true,
        };
      }
      return null;
    }

    return null;
  }, [
    currencyFamily,
    isEditEvmTxEnabled,
    params,
    mainAccount,
    operation,
    bitcoinParams?.supportedCurrencyIds,
    isEditBitcoinTxEnabled,
  ]);

  const editable = editConfig?.isSupported ?? false;

  const dispatch = useDispatch();

  const handleOpenEditModal = useCallback(() => {
    if (!editConfig) {
      return;
    }

    setDrawer(undefined);

    // For Bitcoin, we can edit even without transactionRaw (the modal will fetch it)
    // For EVM, transactionRaw is required
    if (currencyFamily === "bitcoin") {
      // replaceTxId must always be the tx we are replacing (this operation's hash).
      // When re-canceling a cancel, the conflicting tx is the cancel, not the original send,
      // so we must beat the cancel's fee — never use a stored replaceTxId from a previous replacement.
      const transactionRaw =
        operation.transactionRaw != null
          ? { ...operation.transactionRaw, replaceTxId: operation.hash }
          : {
              family: "bitcoin" as const,
              amount: "0",
              recipient: mainAccount.freshAddress,
              rbf: true,
              replaceTxId: operation.hash,
              utxoStrategy: { strategy: 0, excludeUTXOs: [] },
              feePerByte: null,
              networkInfo: null,
            };

      dispatch(
        openModal(editConfig.modalName, {
          account,
          parentAccount,
          transactionRaw,
          transactionHash: operation.hash,
        }),
      );
    } else {
      invariant(operation.transactionRaw, "operation.transactionRaw is required");
      dispatch(
        openModal(editConfig.modalName, {
          account,
          parentAccount,
          transactionRaw: operation.transactionRaw,
          transactionHash: operation.hash,
        }),
      );
    }
  }, [
    dispatch,
    mainAccount.freshAddress,
    editConfig,
    currencyFamily,
    account,
    parentAccount,
    operation.transactionRaw,
    operation.hash,
  ]);

  const isStuck = isStuckOperation({ family: mainAccount.currency.family, operation });
  const feesCurrency = useMemo(() => getFeesCurrency(mainAccount), [mainAccount]);
  const feesUnit = useMemo(() => getFeesUnit(feesCurrency), [feesCurrency]);

  return (
    <Box flow={3} px={20} mt={20}>
      <TrackPage
        category={location.pathname !== "/" ? "Account" : "Portfolio"}
        name="Operation Details"
        currencyName={currency.name}
      />
      <Box alignItems="center" mt={1} mb={3}>
        {IconElement ? (
          <IconElement
            operation={operation}
            type={type}
            marketColor={marketColor}
            isConfirmed={isConfirmed}
            hasFailed={!!hasFailed}
            style={{
              transform: "scale(1.5)",
              padding: 0,
            }}
            t={t}
            withTooltip={false}
          />
        ) : (
          <ConfirmationCheck
            marketColor={marketColor}
            isConfirmed={isConfirmed}
            hasFailed={hasFailed}
            t={t}
            style={{
              transform: "scale(1.5)",
              padding: 0,
            }}
            type={type}
            withTooltip={false}
          />
        )}
      </Box>
      <Text
        ff="Inter|SemiBold"
        textAlign="center"
        fontSize={4}
        color="neutral.c70"
        mt={0}
        mb={1}
        data-testid="transaction-type"
      >
        <Trans i18nKey={`operation.type.${editable ? "SENDING" : operation.type}`} />
      </Text>

      <Box alignItems="center" mt={0}>
        {!amount.isZero() && (
          <Box selectable>
            {hasFailed ? (
              <Box color="alertRed">
                <Trans i18nKey="operationDetails.failed" />
              </Box>
            ) : (
              <ToolTip
                content={
                  AmountTooltip ? (
                    <AmountTooltip operation={operation} amount={amount} unit={unit} />
                  ) : null
                }
              >
                <FormattedVal
                  color={
                    !isConfirmed && operation.type === "IN"
                      ? "warning.c70"
                      : amount.isNegative()
                        ? "neutral.c80"
                        : undefined
                  }
                  unit={unit}
                  alwaysShowSign
                  showCode
                  val={amount}
                  fontSize={7}
                  data-testid="amountReceived-drawer"
                  disableRounding
                />
              </ToolTip>
            )}
          </Box>
        )}
      </Box>

      {url ? (
        <Box m={0} ff="Inter|SemiBold" horizontal justifyContent="center" fontSize={4} my={1}>
          <LinkWithExternalIcon
            fontSize={4}
            onClick={() =>
              url &&
              openURL(url, "viewOperationInExplorer", {
                currencyId: currencyName,
              })
            }
            label={t("operationDetails.viewOperation")}
          />
        </Box>
      ) : null}
      {editable ? (
        <Alert type={isStuck ? "warning" : "primary"}>
          <Trans
            i18nKey={isStuck ? "operation.edit.stuckDescription" : "operation.edit.description"}
          />
          <div>
            <Link
              style={{ textDecoration: "underline", fontSize: "13px" }}
              onClick={handleOpenEditModal}
            >
              <Trans i18nKey="operation.edit.title" />
            </Link>
          </div>
        </Alert>
      ) : null}

      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.amount")}</OpDetailsTitle>
        <OpDetailsData onClick={openAmountDetails}>
          <OpDetailsSideButton mt={0}>
            <Box mr={2}>
              {hasFailed ? null : (
                <CounterValue
                  data-testid="operation-amount"
                  alwaysShowSign
                  color="neutral.c70"
                  fontSize={3}
                  date={date}
                  currency={currency}
                  value={amount}
                />
              )}
            </Box>
            <IconChevronRight size={12} />
          </OpDetailsSideButton>
        </OpDetailsData>
      </OpDetailsSection>

      {(isNegative || fee) && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("operationDetails.fees")}</OpDetailsTitle>
          <OpDetailsData>
            {fee ? (
              <Box alignItems="flex-end">
                <Box horizontal alignItems="center">
                  {urlFeesInfo ? (
                    <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
                      <LinkHelp
                        Icon={InfoCircle}
                        label={<Trans i18nKey="common.info" />}
                        onClick={() => openURL(urlFeesInfo)}
                      />
                    </Box>
                  ) : null}
                  <FormattedVal unit={feesUnit} showCode val={fee} color="neutral.c80" />
                </Box>
                <Box horizontal justifyContent="flex-end">
                  <CounterValue
                    color="neutral.c70"
                    date={date}
                    fontSize={3}
                    currency={feesCurrency}
                    value={fee}
                    subMagnitude={1}
                    style={{
                      width: "auto",
                    }}
                    prefix={
                      <Box
                        mr={1}
                        color="neutral.c70"
                        style={{
                          width: "auto",
                        }}
                      >
                        {"≈"}
                      </Box>
                    }
                  />
                </Box>
              </Box>
            ) : (
              t("operationDetails.noFees")
            )}
          </OpDetailsData>
        </OpDetailsSection>
      )}
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.type")}</OpDetailsTitle>
        <OpDetailsData horizontal alignItems="center">
          {urlWhatIsThis ? (
            <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
              <LinkHelp
                Icon={InfoCircle}
                label={<Trans i18nKey="common.info" />}
                onClick={() => openURL(urlWhatIsThis)}
              />
            </Box>
          ) : undefined}
          <Text
            data-testid="operation-type"
            ff="Inter|SemiBold"
            textAlign="center"
            fontSize={4}
            color="neutral.c70"
          >
            <Trans i18nKey={`operation.type.${operation.type}`} />
          </Text>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.status")}</OpDetailsTitle>
        <OpDetailsData
          color={hasFailed ? "alertRed" : isConfirmed ? "positiveGreen" : undefined}
          horizontal
          flow={1}
        >
          <Box data-testid="status-drawer">
            {hasFailed
              ? t("operationDetails.failed")
              : isConfirmed
                ? t("operationDetails.confirmed")
                : t("operationDetails.notConfirmed")}
            {getEnv("PLAYWRIGHT_RUN")
              ? ""
              : hasFailed
                ? null
                : `${confirmationsString ? ` (${confirmationsString})` : ``}`}
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <Divider />
      {subOperations.length > 0 && account.type === "Account" && (
        <>
          <OpDetailsSection>
            <OpDetailsTitle>
              {t(
                isToken
                  ? "operationDetails.tokenOperations"
                  : "operationDetails.subAccountOperations",
              )}
              &nbsp;
              <LabelInfoTooltip
                text={t(
                  isToken ? "operationDetails.tokenTooltip" : "operationDetails.subAccountTooltip",
                )}
              />
            </OpDetailsTitle>
          </OpDetailsSection>
          <Box
            m={0}
            style={{
              overflowX: "hidden",
            }}
          >
            {subOperations.map((op, i) => {
              const opAccount = findSubAccountById(account, op.accountId);
              if (!opAccount) return null;
              const subAccountName = getAccountCurrency(opAccount).name;
              return (
                <div key={`${op.id}`}>
                  <OperationComponent
                    text={subAccountName}
                    operation={op}
                    account={opAccount}
                    parentAccount={account}
                    onOperationClick={() => openOperation("subOperation", op, operation)}
                    t={t}
                    withAddress={false}
                  />
                  {i < subOperations.length - 1 && <Divider />}
                </div>
              );
            })}
          </Box>
        </>
      )}

      {internalOperations.length > 0 && account.type === "Account" && (
        <>
          <OpDetailsSection>
            <OpDetailsTitle>
              {t("operationDetails.internalOperations")}
              &nbsp;
              <LabelInfoTooltip text={t("operationDetails.internalOpTooltip")} />
            </OpDetailsTitle>
          </OpDetailsSection>
          <Box m={0}>
            {internalOperations.map((op, i) => (
              <div key={`${op.id}`}>
                <OperationComponent
                  text={account.currency.name}
                  operation={op}
                  account={account}
                  onOperationClick={() => openOperation("internalOperation", op, operation)}
                  t={t}
                  withAddress={false}
                />
                {i < internalOperations.length - 1 && <Divider />}
              </div>
            ))}
          </Box>
        </>
      )}

      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.account")}</OpDetailsTitle>
        <OpDetailsData>
          <Box flex="1" ml={2} horizontal justifyContent="flex-end">
            <Box horizontal alignItems="center" flex="unset">
              <Box mt={0} mr={1}>
                <CryptoCurrencyIcon currency={mainCurrency} size={22} />
              </Box>

              <TextEllipsis>
                <Link data-testid="account-name" onClick={goToMainAccount}>
                  {name}
                </Link>
              </TextEllipsis>
              <AccountTagDerivationMode account={account} />
            </Box>

            {parentAccount ? (
              <>
                <Separator>{"/"}</Separator>
                <Box horizontal alignItems="center" flex="unset">
                  <Box mt={0} mr={1}>
                    <CryptoCurrencyIcon currency={currency} size={22} />
                  </Box>
                  <TextEllipsis>
                    <Link onClick={goToSubAccount}>{currency.name}</Link>
                  </TextEllipsis>
                  <AccountTagDerivationMode account={parentAccount} />
                </Box>
              </>
            ) : null}
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      {OpDetailsPostAccountSection && (
        <OpDetailsPostAccountSection
          operation={operation}
          type={type}
          account={account as Account}
        />
      )}
      <OpDetailsSection>
        <OpDetailsTitle data-testid="operation-date-label">
          {t("operationDetails.date")}
        </OpDetailsTitle>
        <OpDetailsData data-testid="operation-date">{dateFormatted}</OpDetailsData>
      </OpDetailsSection>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.identifier")}</OpDetailsTitle>
        <OpDetailsData>
          <HashContainer data-testid="operation-id">
            <SplitAddress value={hash} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={hash} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>
      {uniqueSenders.length ? (
        <OpDetailsSection data-testid="operation-from">
          <OpDetailsTitle>{t("operationDetails.from")}</OpDetailsTitle>
          <DataList lines={uniqueSenders} t={t} />
        </OpDetailsSection>
      ) : null}
      {recipients.length ? (
        <OpDetailsSection>
          <OpDetailsTitle>{t("operationDetails.to")}</OpDetailsTitle>
          <Box data-testid="operation-to" alignItems="flex-end" flex="1">
            {recipients.length > 1 ? (
              <Link>
                <FakeLink
                  underline
                  fontSize={3}
                  ml={2}
                  color="neutral.c80"
                  onClick={() => openURL(urls.multipleDestinationAddresses)}
                >
                  <Box mr={1}>
                    <IconExternalLink size={12} />
                  </Box>
                  {t("operationDetails.multipleAddresses")}
                </FakeLink>
              </Link>
            ) : null}
            <DataList lines={recipients} t={t} />
          </Box>
        </OpDetailsSection>
      ) : null}
      {OpDetailsExtra && (
        <OpDetailsExtra operation={operation} type={type} account={account as Account} />
      )}
      <Divider />
      {OpDetailsPostAlert && (
        <OpDetailsPostAlert operation={operation} type={type} account={account as Account} />
      )}
    </Box>
  );
};
const OpDetails = (
  props: RestProps & {
    operation: Operation | null | undefined;
    account: AccountLike | null | undefined;
    parentAccount: Account | undefined;
  },
) => {
  const { operation, account, parentAccount, ...rest } = props;
  if (!operation || !account || !operation) return null;
  return (
    <OperationD account={account} parentAccount={parentAccount} operation={operation} {...rest} />
  );
};
export const OperationDetails = connect(mapStateToProps)(OpDetails);

type OperationDetailsExtraProps = {
  operation: Operation;
  account: Account;
  type: OperationType;
};
const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  let jsx = null;

  // Safety type checks
  if (operation.extra && typeof operation.extra === "object" && !Array.isArray(operation.extra)) {
    jsx = Object.entries(operation.extra as object).map(([key, value]) => {
      if (typeof value === "object" || typeof value === "function") return null;
      return (
        <OpDetailsSection key={key}>
          <OpDetailsTitle>
            <Trans i18nKey={`operationDetails.extra.${key}`} defaults={key} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Ellipsis>{value}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      );
    });
  }

  return <>{jsx}</>;
};
const More = styled(Text).attrs<TextProps>(p => ({
  ff: p.ff ? p.ff : "Inter|Bold",
  fontSize: p.fontSize ? p.fontSize : 2,
  color: p.color || "neutral.c100",
  tabIndex: 0,
}))<TextProps & { textTransform?: boolean }>`
  text-transform: ${p => (!p.textTransform ? "auto" : "uppercase")};
  outline: none;
`;
export class DataList extends Component<{
  lines: string[];
  t: TFunction;
}> {
  state = {
    numToShow: 2,
    showMore: true,
  };

  onClick = () => {
    this.setState(({ showMore }: { showMore: boolean; numToShow: number | undefined }) => ({
      showMore: !showMore,
      numToShow: showMore ? undefined : 2,
    }));
  };

  render() {
    const { lines, t } = this.props;
    const { showMore, numToShow } = this.state;
    // Hardcoded for now
    const shouldShowMore = lines.length > 3;
    const renderLine = (line: string, index: number) => (
      <OpDetailsData relative horizontal key={line + index}>
        <HashContainer>
          <SplitAddress value={line} />
        </HashContainer>
        <GradientHover>
          <CopyWithFeedback text={line} />
        </GradientHover>
      </OpDetailsData>
    );
    return (
      <Box
        flex="1"
        alignItems="flex-end"
        style={{
          maxWidth: "100%",
        }}
      >
        {lines.slice(0, numToShow).map(renderLine)}
        {shouldShowMore ? (
          <OpDetailsSideButton mt={2} onClick={this.onClick}>
            <More fontSize={4} color="wallet" ff="Inter|SemiBold" mt={1}>
              <IconChevronRight size={12} />
              {showMore
                ? t("operationDetails.showMore", {
                    recipients: lines.length - 2,
                  })
                : t("operationDetails.showLess")}
            </More>
          </OpDetailsSideButton>
        ) : null}
      </Box>
    );
  }
}
