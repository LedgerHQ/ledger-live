import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Navigate, useParams } from "react-router";
import { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Box from "~/renderer/components/Box";
import OperationsList from "~/renderer/components/OperationsList";
import ShowHiddenSmallValueOperationsToggle from "~/renderer/components/ShowHiddenSmallValueOperationsToggle";
import useTheme from "~/renderer/hooks/useTheme";
import { useSmallValueOperationsFilter } from "~/renderer/hooks/useSmallValueOperationsFilter";
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

export default function AssetPage() {
  const { "*": assetId } = useParams<{ "*": string }>();
  const { t } = useTranslation();
  const paperColor = useTheme().colors.background.card;
  const range = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const countervalueFirst = useSelector(countervalueFirstSelector);
  const allAccounts = useSelector(accountsSelector);
  const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
  const { filterOperations, isSmallValueFilterEnabled } = useSmallValueOperationsFilter(
    showHiddenSmallValueOperations,
  );
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: isSmallValueFilterEnabled,
  });

  const accounts = useFlattenSortAccounts({
    enforceHideEmptySubAccounts: true,
  }).filter(a => getAccountCurrency(a).id === assetId);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => allAccounts.find(a => a.id === id) || null,
    [allAccounts],
  );
  const unit = useMaybeAccountUnit(accounts[0]);
  if (!accounts.length || !unit) return <Navigate to="/" replace />;
  const parentAccount =
    accounts[0].type !== "Account" ? lookupParentAccount(accounts[0].parentId) : null;
  const currency = getAccountCurrency(accounts[0]);

  const accountFamily =
    accounts[0].type === "TokenAccount"
      ? accounts[0].token.parentCurrency.family
      : accounts[0].currency.family;
  const showToggle = isSmallValueFilterEnabled && addressPoisoningFamilies?.includes(accountFamily);

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
        {showToggle ? (
          <Box mb={3} alignItems="flex-end">
            <ShowHiddenSmallValueOperationsToggle
              isChecked={showHiddenSmallValueOperations}
              onChange={setShowHiddenSmallValueOperations}
            />
          </Box>
        ) : null}
        <OperationsList
          accounts={accounts}
          title={t("dashboard.recentActivity")}
          withAccount
          filterOperation={filterOperations}
          t={t}
        />
      </Box>
    </Box>
  );
}
