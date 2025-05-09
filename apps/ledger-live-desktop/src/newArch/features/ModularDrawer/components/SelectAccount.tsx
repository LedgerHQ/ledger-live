import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountList, CardButton } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";
import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import {
  getBalanceHistoryWithCountervalue,
  getPortfolioCount,
} from "@ledgerhq/live-countervalues/lib-es/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib-es/derivation";

type Props = {
  asset: CryptoOrTokenCurrency;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  source: string;
  flow: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();

  const accounts = getAccountTuplesForCurrency(asset, nestedAccounts, false, accountIds);

  return useMemo(
    () =>
      accounts.map(({ account }) => {
        const count = getPortfolioCount([account], "day");

        const balance = formatCurrencyUnit(account.currency.units[0], account.balance, {
          showCode: true,
        });

        const { history } = getBalanceHistoryWithCountervalue(account, "day", count, state, to);
        const { countervalue } = history[history.length - 1];
        const fiatValue = formatCurrencyUnit(to.units[0], BigNumber(countervalue || 0), {
          showCode: true,
        });

        const address = `${account.freshAddress.slice(0, 5)}...${account.freshAddress.slice(-5)}`;
        const protocol = getTagDerivationMode(account.currency, account.derivationMode); // TODO consider capital letters

        return {
          name: account.currency.name,
          id: account.currency.id,
          ticker: account.currency.ticker,
          balance,
          fiatValue,
          protocol: protocol || "",
          address,
        };
      }),
    [accounts, state, to],
  );
};

export const SelectAccount = ({ asset, accounts$, onAccountSelected, source, flow }: Props) => {
  const detailedAccounts = useDetailedAccounts(asset, accounts$);
  const { t } = useTranslation();

  const onAddAccountClick = () => {
    // TODO: To be implemented in LIVE-17272
    track("button_clicked", {
      button: "Add a new account",
      page: "Modular Account Selection",
      flow,
    });
  };

  const onAccountClick = (networkId: string) => {
    track("account_clicked", { currency: networkId, page: "Modular Account Selection", flow });
    onAccountSelected({} as AccountLike, {} as Account);
  };

  return (
    <>
      <TrackPage category={source} name="Modular Account Selection" flow={flow} />
      <CardButton
        onClick={onAddAccountClick}
        title={t("drawers.selectAccount.addAccount")}
        iconRight={<Icons.Plus size="S" />}
        variant="dashed"
      />
      <div style={{ flex: "1 1 auto", width: "100%" }}>
        <AccountList accounts={detailedAccounts} onClick={onAccountClick} />
      </div>
    </>
  );
};
