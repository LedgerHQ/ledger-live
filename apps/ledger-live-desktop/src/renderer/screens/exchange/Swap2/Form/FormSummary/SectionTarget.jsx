// @flow
import React, { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { track } from "~/renderer/analytics/segment";
import SummaryLabel from "./SummaryLabel";
import SectionInformative from "./SectionInformative";
import SummaryValue, { NoValuePlaceholder } from "./SummaryValue";
import { useTranslation } from "react-i18next";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getAccountName } from "@ledgerhq/live-common/account/index";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import SummarySection from "./SummarySection";
import { openModal } from "~/renderer/actions/modals";
import { context } from "~/renderer/drawers/Provider";
import { useGetSwapTrackingProperties } from "../../utils/index";

import type {
  SwapSelectorStateType,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import TargetAccountDrawer from "../TargetAccountDrawer";

const AccountSection = ({
  account,
  currency,
  handleChange,
}: {
  account: $PropertyType<SwapSelectorStateType, "account">,
  currency: TokenCurrency | CryptoCurrency,
  handleChange: ?() => void,
}) => {
  const { t } = useTranslation();
  const accountName = getAccountName(account);
  const swapDefaultTrack = useGetSwapTrackingProperties();

  const handleChangeAndTrack = useCallback(() => {
    track("button_clicked", {
      button: "change target account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
    handleChange();
  }, [handleChange, swapDefaultTrack]);

  return (
    <SummarySection>
      <SummaryLabel label={t("swap2.form.details.label.target")} />
      <SummaryValue value={accountName} handleChange={handleChangeAndTrack}>
        {currency ? <CryptoCurrencyIcon circle currency={currency} size={16} /> : null}
      </SummaryValue>
    </SummarySection>
  );
};

const PlaceholderSection = () => {
  const { t } = useTranslation();

  return (
    <SummarySection>
      <SummaryLabel label={t("swap2.form.details.label.target")} />
      <SummaryValue>
        <NoValuePlaceholder />
      </SummaryValue>
    </SummarySection>
  );
};

type SectionTargetProps = {
  account: $PropertyType<SwapSelectorStateType, "account">,
  currency: $PropertyType<SwapSelectorStateType, "currency">,
  setToAccount: $PropertyType<SwapTransactionType, "setToAccount">,
  targetAccounts: $PropertyType<SwapTransactionType, "targetAccounts">,
  hasRates: boolean,
};
const SectionTarget = ({
  account,
  currency,
  setToAccount,
  targetAccounts,
  hasRates,
}: SectionTargetProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setDrawer } = React.useContext(context);
  const swapDefaultTrack = useGetSwapTrackingProperties();

  const handleAddAccount = () => {
    track("button_clicked", {
      button: "add account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
    dispatch(openModal("MODAL_ADD_ACCOUNTS", { currency, ...swapDefaultTrack }));
  };

  const hideEdit = !targetAccounts || targetAccounts.length < 2;

  // Using a ref to keep the drawer state synced.
  const setDrawerStateRef = useRef(null);
  useEffect(() => {
    setDrawerStateRef.current &&
      setDrawerStateRef.current({
        selectedAccount: account,
        targetAccounts,
      });
  }, [account, targetAccounts]);

  const showDrawer = () => {
    setDrawer(TargetAccountDrawer, {
      accounts: targetAccounts,
      selectedAccount: account,
      setToAccount: setToAccount,
      setDrawerStateRef: setDrawerStateRef,
    });
  };

  const handleEditAccount = hideEdit ? null : showDrawer;

  if (!currency || !hasRates) return <PlaceholderSection />;
  if (!account)
    return (
      <SectionInformative
        onClick={handleAddAccount}
        ctaLabel={t("swap2.form.details.noAccountCTA")}
        message={t("swap2.form.details.noAccount", { name: currency.name })}
      />
    );

  return <AccountSection account={account} currency={currency} handleChange={handleEditAccount} />;
};

export default React.memo<SectionTargetProps>(SectionTarget);
