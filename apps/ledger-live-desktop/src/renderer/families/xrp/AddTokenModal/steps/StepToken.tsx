import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { XRP_DEV_TOKENS } from "@ledgerhq/live-common/families/xrp/devTokens";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { TokenCurrency } from "@domain/entity-currency-token";
import { TrackScreen } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import Alert from "~/renderer/components/Alert";
import InfoCircle from "~/renderer/icons/InfoCircle";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import logger from "~/renderer/logger";
import { ACTION_I18N, StepProps } from "../types";

// TEMP prototype: the CAL lists no XRPL token yet, so the choices are the hardcoded dev tokens
export function findDevToken(transaction: Transaction) {
  return XRP_DEV_TOKENS.find(token => {
    const isSameCurrency = token.tokenIdentifier === transaction.assetReference;
    const isSameIssuer = token.contractAddress === transaction.assetOwner;
    return isSameCurrency && isSameIssuer;
  });
}

// Null when the node fails: the limit then has to be typed in
async function fetchMaxLimit(currencyId: string, token: TokenCurrency): Promise<BigNumber | null> {
  try {
    return await getMaxTrustLimitForToken(
      currencyId,
      token.contractAddress,
      token.tokenIdentifier ?? "",
    );
  } catch (maxLimitError) {
    logger.critical(maxLimitError);
    return null;
  }
}

function renderToken(option: { data: TokenCurrency }) {
  const token = option.data;

  return (
    <Box key={token.id} horizontal alignItems="center" width="100%">
      <Box noShrink mr={2}>
        <FirstLetterIcon label={token.name} />
      </Box>
      <Ellipsis ff="Inter|Medium">{token.name}</Ellipsis>
      <Text fontSize={3} color="neutral.c60" ml={2}>
        {token.ticker}
      </Text>
      <Text fontSize={3} color="neutral.c60" ml="auto" pl={3} title={token.contractAddress}>
        {formatAddress(token.contractAddress)}
      </Text>
    </Box>
  );
}

export default function StepToken({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  warning,
  error,
  t,
  maxLimit,
  setMaxLimit,
  action,
  tokenAccount,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");

  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const selectedTokenId = useRef<string | null>(null);

  // A removed token keeps its token account, for its history, but no resources: it can be added again
  const heldTokenIds = useMemo(() => {
    const heldTokenAccounts = (account.subAccounts ?? []).filter(sub => {
      return sub.type === "TokenAccount" && !!(sub as XrpTokenAccount).xrpResources;
    });

    return new Set(heldTokenAccounts.map(sub => sub.token.id));
  }, [account]);

  const options = useMemo(() => {
    return XRP_DEV_TOKENS.filter(token => {
      const isOnAccountCurrency = token.parentCurrencyId === account.currency.id;
      return isOnAccountCurrency && !heldTokenIds.has(token.id);
    });
  }, [account, heldTokenIds]);

  const selectedToken = tokenAccount?.token ?? findDevToken(transaction);
  const isIou = selectedToken?.tokenType === "iou";
  const hasLimitInput = isIou && action !== "remove";
  // Every TrustSet sets No Ripple, so an edit also turns rippling off
  const isRippling = (tokenAccount as XrpTokenAccount | undefined)?.xrpResources?.isRippling;

  // An edit starts from the current limit, so Max is only offered
  useEffect(() => {
    if (action !== "edit" || !tokenAccount || maxLimit) return;

    fetchMaxLimit(account.currency.id, tokenAccount.token).then(setMaxLimit);
  }, [account.currency.id, action, maxLimit, setMaxLimit, tokenAccount]);

  // An IOU's limit is the transaction amount, prefilled with Max. An MPToken has no limit
  const onChange = useCallback(
    async (token?: TokenCurrency | null) => {
      if (!token?.tokenIdentifier) return;
      selectedTokenId.current = token.id;

      const max =
        token.tokenType === "iou" ? await fetchMaxLimit(account.currency.id, token) : null;

      // A later choice wins over this one's slower Max
      if (selectedTokenId.current !== token.id) return;
      setMaxLimit(max);

      // The currency code or MPT issuance id is the tokenIdentifier: the name is only for display
      onUpdateTransaction(tx => {
        return bridge.updateTransaction(tx, {
          assetReference: token.tokenIdentifier,
          assetOwner: token.contractAddress,
          amount: max ?? new BigNumber(0),
        });
      });
    },
    [account.currency.id, bridge, onUpdateTransaction, setMaxLimit],
  );

  const onLimitChange = useCallback(
    (limit: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount: limit }));
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <Box flow={1} mb={4}>
        <Select
          value={selectedToken}
          options={options}
          getOptionValue={token => token.id}
          getOptionLabel={token => `${token.name} ${token.ticker} ${token.contractAddress}`}
          renderValue={renderToken}
          renderOption={renderToken}
          placeholder={t("xrp.addToken.steps.token.selectLabel")}
          noOptionsMessage={input => t("common.selectNoResults", { query: input.inputValue })}
          onChange={onChange}
          isDisabled={!!tokenAccount}
        />
      </Box>
      {hasLimitInput && selectedToken ? (
        <Box flow={1} mb={4}>
          <Label>
            <Trans i18nKey="xrp.addToken.steps.token.limitLabel" />
          </Label>
          <InputCurrency
            defaultUnit={selectedToken.units[0]}
            value={transaction.amount}
            onChange={onLimitChange}
            renderRight={
              maxLimit?.gt(0) ? (
                <Button small mr={1} onClick={() => onLimitChange(maxLimit)}>
                  <Trans i18nKey="xrp.addToken.steps.token.limitMax" />
                </Button>
              ) : null
            }
          />
          {isRippling ? (
            <Alert type="warning" mt={2}>
              <Trans
                i18nKey="xrp.tokenAccount.rippling.turnOff"
                values={{ token: selectedToken.name }}
              />
            </Alert>
          ) : (
            <ToolTip
              content={
                <Trans
                  i18nKey="xrp.tokenAccount.rippling.explanation"
                  values={{ token: selectedToken.name }}
                />
              }
            >
              <Box horizontal alignItems="center" color="neutral.c70">
                <Text fontSize={3} mr={1}>
                  <Trans i18nKey="xrp.tokenAccount.rippling.keepOff" />
                </Text>
                <InfoCircle size={12} />
              </Box>
            </ToolTip>
          )}
        </Box>
      ) : null}
      <Alert type="primary">
        <Trans i18nKey={`${ACTION_I18N[action]}.steps.token.info`} />
      </Alert>
    </Box>
  );
}

export function StepTokenFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");

  const hasErrors = Object.keys(status.errors).length > 0;
  const hasSelectedToken = !!transaction?.assetReference && !!transaction?.assetOwner;
  const isReady = !bridgePending && !hasErrors;
  const canNext = isReady && hasSelectedToken;

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          disabled={!canNext}
          isLoading={bridgePending}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
