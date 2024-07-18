import {
  SwapSelectorStateType,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { track } from "~/renderer/analytics/segment";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { context } from "~/renderer/drawers/Provider";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useGetSwapTrackingProperties } from "../../utils/index";
import TargetAccountDrawer from "../TargetAccountDrawer";
import { useIsSwapLiveFlagEnabled } from "../useIsSwapLiveFlagEnabled";
import SectionInformative from "./SectionInformative";
import SummaryLabel from "./SummaryLabel";
import SummarySection from "./SummarySection";
import SummaryValue, { Container, Text, NoValuePlaceholder } from "./SummaryValue";
import styled from "styled-components";

const AccountSectionContainer = styled(SummarySection)`
  column-gap: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;

  ${Container}, ${Text} {
    flex-shrink: 1;
  }

  ${Container} ${Text} {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const AccountSection = ({
  account,
  currency,
  handleChange,
}: {
  account: SwapSelectorStateType["account"];
  currency: TokenCurrency | CryptoCurrency;
  handleChange?: () => void;
}) => {
  const { t } = useTranslation();
  const accountName = useMaybeAccountName(account);

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const handleChangeAndTrack = useCallback(() => {
    track("button_clicked2", {
      button: "change target account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });

    if (handleChange) {
      handleChange();
    }
  }, [handleChange, swapDefaultTrack]);

  return (
    <AccountSectionContainer>
      <SummaryLabel label={t("swap2.form.details.label.target")} />
      <SummaryValue
        value={accountName}
        {...(handleChange ? { handleChange: handleChangeAndTrack } : {})}
      >
        {currency ? <CryptoCurrencyIcon circle currency={currency} size={16} /> : null}
      </SummaryValue>
    </AccountSectionContainer>
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
  account: SwapSelectorStateType["account"];
  currency: SwapSelectorStateType["currency"];
  setToAccount: SwapTransactionType["setToAccount"];
  targetAccounts: AccountLike[] | undefined;
  hasRates: boolean;
};

type SetDrawerStateRef = (args: {
  selectedAccount: AccountLike | undefined;
  targetAccounts: AccountLike[] | undefined;
}) => void;
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
  const isDemo0Enabled = useIsSwapLiveFlagEnabled("ptxSwapLiveAppDemoZero");

  const handleAddAccount = () => {
    track("button_clicked2", {
      button: "add account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
    dispatch(openModal("MODAL_ADD_ACCOUNTS", { currency, ...swapDefaultTrack }));
  };

  const hideEdit = !targetAccounts || targetAccounts.length < 2;

  // Using a ref to keep the drawer state synced.
  const setDrawerStateRef = useRef<SetDrawerStateRef>(null);
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

  const handleEditAccount = hideEdit ? undefined : showDrawer;

  if (!currency || (isDemo0Enabled && !hasRates)) return <PlaceholderSection />;

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
