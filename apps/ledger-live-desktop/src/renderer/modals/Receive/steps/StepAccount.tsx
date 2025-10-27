import React from "react";
import { Trans } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { supportLinkByTokenType } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import SelectAccount from "~/renderer/components/SelectAccount";
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
export default function StepAccount(props: Readonly<StepProps>) {
  const { account, parentAccount, onChangeAccount, eventType, accountError } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const tokenTypes = mainAccount ? listTokenTypesForCryptoCurrency(mainAccount.currency) : [];

  // Nb in the context of LL-6449 (nft integration) simplified the wording for the warning.
  const tokenType =
    mainAccount?.currency.name === "Ethereum"
      ? mainAccount.currency.name
      : tokenTypes.map(tt => tt.toUpperCase()).join("/");
  const url = supportLinkByTokenType[tokenTypes[0] as keyof typeof supportLinkByTokenType];
  const specific = mainAccount ? getLLDCoinFamily(mainAccount.currency.family) : null;
  const StepReceiveAccountCustomAlert = specific?.StepReceiveAccountCustomAlert;

  return (
    <Box flow={1}>
      <TrackPage
        category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step 1"
        isTokenAdd={account?.type === "TokenAccount"}
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {accountError ? <ErrorBanner error={accountError} /> : null}

      <AccountSelection account={account} onChangeAccount={onChangeAccount} />

      {account && tokenTypes.length ? (
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
export function StepAccountFooter({ transitionTo, account, accountError }: Readonly<StepProps>) {
  return (
    <Button
      data-testid="modal-continue-button"
      disabled={!account || accountError}
      primary
      onClick={() => transitionTo("device")}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}
