import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Redirect } from "react-router";
import { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Box from "~/renderer/components/Box";
import OperationsList from "~/renderer/components/OperationsList";
import useTheme from "~/renderer/hooks/useTheme";
import AccountDistribution from "./AccountDistribution";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import BalanceSummary from "./BalanceSummary";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useFlattenSortAccounts } from "~/renderer/actions/general";
import AssetHeader from "./AssetHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
type Props = {
  match: {
    params: {
      assetId: string;
    };
    isExact: boolean;
    path: string;
    url: string;
  };
};
export default function AssetPage({ match }: Props) {
  const { t } = useTranslation();
  const paperColor = useTheme().colors.palette.background.paper;
  const range = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const countervalueFirst = useSelector(countervalueFirstSelector);
  const allAccounts = useSelector(accountsSelector);

  const accounts = useFlattenSortAccounts({
    enforceHideEmptySubAccounts: true,
  }).filter(a => getAccountCurrency(a).id === match.params.assetId);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => allAccounts.find(a => a.id === id) || null,
    [allAccounts],
  );
  const unit = useMaybeAccountUnit(accounts[0]);
  if (!accounts.length || !unit) return <Redirect to="/" />;
  const parentAccount =
    accounts[0].type !== "Account" ? lookupParentAccount(accounts[0].parentId) : null;
  const currency = getAccountCurrency(accounts[0]);

  const color = getCurrencyColor(currency, paperColor);
  return (
    <Box>
      <TrackPage category="Portfolio" name="Asset allocation" currencyName={currency.name} />
      <Box mb={24}>
        <AssetHeader account={accounts[0]} parentAccount={parentAccount} />
      </Box>
      <BalanceSummary
        account={accounts[0]}
        key={currency.id}
        countervalueFirst={countervalueFirst}
        currency={currency}
        range={range}
        chartColor={color}
        unit={unit}
        counterValue={counterValue}
      />
      <Box mt={40}>
        <AccountDistribution accounts={accounts} />
      </Box>
      <Box mt={40}>
        <OperationsList accounts={accounts} title={t("dashboard.recentActivity")} withAccount />
      </Box>
    </Box>
  );
}
