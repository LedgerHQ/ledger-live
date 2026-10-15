import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { XRP_DEV_TOKENS } from "@ledgerhq/live-common/families/xrp/devTokens";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { TokenCurrency } from "@domain/entity-currency-token";
import { TrackPage } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { StepProps } from "../types";

// TEMP prototype: the CAL lists no XRPL token yet, so the choices are the hardcoded dev tokens
export const findDevToken = (transaction: Transaction) =>
  XRP_DEV_TOKENS.find(
    token =>
      token.tokenIdentifier === transaction.assetReference &&
      token.contractAddress === transaction.assetOwner,
  );

const renderItem = ({ data: { id, name, ticker, contractAddress } }: { data: TokenCurrency }) => (
  <Box key={id} horizontal alignItems="center" width="100%">
    <Box noShrink mr={2}>
      <FirstLetterIcon label={name} />
    </Box>
    <Ellipsis ff="Inter|Medium">{name}</Ellipsis>
    <Text fontSize={3} color="neutral.c60" ml={2}>
      {ticker}
    </Text>
    <Text fontSize={3} color="neutral.c60" ml="auto" pl={3} title={contractAddress}>
      {formatAddress(contractAddress)}
    </Text>
  </Box>
);

export default function StepToken({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  warning,
  error,
  t,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  // A held token cannot be opted in to again
  const options = useMemo(
    () =>
      XRP_DEV_TOKENS.filter(
        token =>
          token.parentCurrencyId === account.currency.id &&
          !account.subAccounts?.some(sub => sub.type === "TokenAccount" && sub.token.id === token.id),
      ),
    [account],
  );

  const onChange = useCallback(
    (token?: TokenCurrency | null) => {
      if (!token) return;
      // The currency code or MPT issuance id is the tokenIdentifier: the name is only for display
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          assetReference: token.tokenIdentifier,
          assetOwner: token.contractAddress,
        }),
      );
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackPage category="XRP add token" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <Box flow={1} mb={4}>
        <Select
          value={findDevToken(transaction)}
          options={options}
          getOptionValue={({ id }) => id}
          getOptionLabel={({ name, ticker, contractAddress }) =>
            `${name} ${ticker} ${contractAddress}`
          }
          renderValue={renderItem}
          renderOption={renderItem}
          placeholder={t("xrp.addToken.steps.token.selectLabel")}
          noOptionsMessage={({ inputValue }) => t("common.selectNoResults", { query: inputValue })}
          onChange={onChange}
        />
      </Box>
      <Alert type="primary">
        <Trans i18nKey="xrp.addToken.steps.token.info" />
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
  const canNext = !bridgePending && !hasErrors && hasSelectedToken;
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
