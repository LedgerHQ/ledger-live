import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { TokenCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { supportLinkByTokenType } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import SelectAccount from "~/renderer/components/SelectAccount";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Alert from "~/renderer/components/Alert";
import { getLLDCoinFamily } from "~/renderer/families";
import { StepProps } from "../Body";

type OnChangeAccount = (account?: AccountLike | null, tokenAccount?: Account | null) => void;
const AccountSelection = ({
  onChangeAccount,
  account,
}: {
  onChangeAccount: OnChangeAccount;
  account: AccountLike | undefined | null;
}) => (
  <>
    <Label>
      <Trans i18nKey="receive.steps.chooseAccount.label" />
    </Label>
    <SelectAccount autoFocus withSubAccounts onChange={onChangeAccount} value={account} />
  </>
);
const TokenParentSelection = ({
  onChangeAccount,
  mainAccount,
}: {
  onChangeAccount: OnChangeAccount;
  mainAccount: Account;
}) => {
  const filterAccountSelect = useCallback(
    (a: AccountLike) => getAccountCurrency(a) === mainAccount.currency,
    [mainAccount],
  );
  return (
    <>
      <Label>
        <Trans
          i18nKey="receive.steps.chooseAccount.parentAccount"
          values={{
            currencyName: mainAccount.currency.name,
          }}
        />
      </Label>
      <SelectAccount filter={filterAccountSelect} onChange={onChangeAccount} value={mainAccount} />
    </>
  );
};
const TokenSelection = ({
  token,
  onChangeToken,
  networkFamily,
}: {
  token: TokenCurrency | undefined | null;
  onChangeToken: (token?: TokenCurrency | null) => void;
  networkFamily: string;
}) => {
  const [lastItemIndex, setLastItemIndex] = useState<number | undefined>(undefined);
  const [keepLastScrollPosition, setKeepLastScrollPosition] = useState(false);

  const {
    data: tokensData,
    isLoading,
    error,
    loadNext,
  } = useTokensData({
    networkFamily: networkFamily,
  });

  const handleMenuScrollToBottom = useCallback(() => {
    if (loadNext) {
      setLastItemIndex(tokensData ? tokensData.tokens.length - 1 : 0);
      setKeepLastScrollPosition(true);
      loadNext();
    }
  }, [loadNext, tokensData]);

  if (error) {
    return (
      <>
        <Label mt={30}>
          <Trans i18nKey="receive.steps.chooseAccount.token" />
        </Label>
        <Box>
          <Trans i18nKey="receive.steps.chooseAccount.errorLoadingTokens" />
        </Box>
      </>
    );
  }

  if (isLoading && !tokensData?.tokens.length) {
    return (
      <>
        <Label mt={30}>
          <Trans i18nKey="receive.steps.chooseAccount.token" />
        </Label>
        <Box>
          <Trans i18nKey="common.loading" />
        </Box>
      </>
    );
  }

  return (
    <>
      <Label mt={30}>
        <Trans i18nKey="receive.steps.chooseAccount.token" />
      </Label>
      <SelectCurrency
        onChange={onChangeToken as (token?: CryptoOrTokenCurrency | null) => void}
        currencies={tokensData?.tokens || []}
        value={token}
        onMenuScrollToBottom={handleMenuScrollToBottom}
        lastItemIndex={lastItemIndex}
        keepLastScrollPosition={keepLastScrollPosition}
        isLoading={isLoading}
      />
    </>
  );
};
export default function StepAccount(props: Readonly<StepProps>) {
  const {
    token,
    account,
    parentAccount,
    receiveTokenMode,
    onChangeAccount,
    onChangeToken,
    eventType,
    accountError,
  } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const tokenTypes = mainAccount ? mainAccount.currency.tokenTypes || [] : [];

  // Nb in the context of LL-6449 (nft integration) simplified the wording for the warning.
  const tokenType =
    mainAccount?.currency.name === "Ethereum"
      ? mainAccount.currency.name
      : tokenTypes.map(tt => tt.toUpperCase()).join("/");
  const url = supportLinkByTokenType[tokenTypes[0] as keyof typeof supportLinkByTokenType];
  const specific = mainAccount ? getLLDCoinFamily(mainAccount.currency.family) : null;
  const StepReceiveAccountCustomAlert = specific?.StepReceiveAccountCustomAlert;
  const receiveTokensConfig = specific?.receiveTokensConfig;

  return (
    <Box flow={1}>
      <TrackPage
        category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step 1"
        isTokenAdd={receiveTokenMode || account?.type === "TokenAccount"}
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {accountError ? <ErrorBanner error={accountError} /> : null}

      {receiveTokenMode && mainAccount ? (
        <TokenParentSelection mainAccount={mainAccount} onChangeAccount={onChangeAccount} />
      ) : (
        <AccountSelection account={account} onChangeAccount={onChangeAccount} />
      )}
      {receiveTokenMode && mainAccount && receiveTokensConfig ? (
        <TokenSelection
          token={token}
          onChangeToken={onChangeToken}
          networkFamily={receiveTokensConfig.networkFamily}
        />
      ) : null}

      {account && !receiveTokenMode && tokenTypes.length ? (
        <div>
          <Alert type="warning" learnMoreUrl={url} mt={3}>
            <Trans
              i18nKey={`receive.steps.chooseAccount.${
                account.type === "TokenAccount" ? "verifyTokenType" : "warningTokenType"
              }`}
              values={
                account.type === "TokenAccount"
                  ? {
                      token: account.token.name,
                      tokenType,
                      currency: mainAccount && mainAccount.currency.name,
                    }
                  : {
                      ticker: account.currency.ticker,
                      tokenType,
                      currency: account.currency.name,
                    }
              }
            >
              <b></b>
            </Trans>
          </Alert>
        </div>
      ) : null}
      {!!account && !!StepReceiveAccountCustomAlert && (
        <StepReceiveAccountCustomAlert {...props} account={account} />
      )}
    </Box>
  );
}
export function StepAccountFooter({
  transitionTo,
  receiveTokenMode,
  token,
  account,
  accountError,
  parentAccount,
}: StepProps) {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const specific = mainAccount ? getLLDCoinFamily(mainAccount.currency.family) : null;
  const receiveTokensConfig = specific?.receiveTokensConfig;
  const shouldRequireToken = receiveTokenMode && receiveTokensConfig;

  return (
    <Button
      data-testid="modal-continue-button"
      disabled={!account || (shouldRequireToken && !token) || accountError}
      primary
      onClick={() => transitionTo("device")}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}
