import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { context } from "~/renderer/drawers/Provider";
import SummaryLabel from "./SummaryLabel";
import SummaryValue, { NoValuePlaceholder } from "./SummaryValue";
import SummarySection from "./SummarySection";
import FeesDrawer from "../FeesDrawer";
import {
  SwapTransactionType,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { track } from "~/renderer/analytics/segment";
import { rateSelector } from "~/renderer/actions/swap";
import FormattedVal from "~/renderer/components/FormattedVal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import styled from "styled-components";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { getLLDCoinFamily } from "~/renderer/families";

type Strategies = "slow" | "medium" | "fast" | "advanced";

const FEES_STRATEGY_ICONS: {
  [x in Strategies]: (a: { color?: string; size?: number }) => React.ReactElement<"svg">;
} = {
  slow: TachometerLow,
  medium: TachometerMedium,
  fast: TachometerHigh,
  advanced: TachometerHigh,
};
const IconSection = styled(Box)`
  flex-direction: row;
  column-gap: 0.25rem;
  color: ${props => props.theme.colors.palette.text.shade40};
`;
const Separator = styled.div`
  width: 3px;
  height: 3px;
  background-color: ${props => props.theme.colors.palette.text.shade40};
  border-radius: 9999px;
  align-self: center;
  margin-left: 2px;
`;

type Props = {
  transaction: SwapTransactionType["transaction"];
  account: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  currency: SwapSelectorStateType["currency"];
  status: SwapTransactionType["status"];
  updateTransaction: SwapTransactionType["updateTransaction"];
  setTransaction: SwapTransactionType["setTransaction"];
  provider: string | undefined | null;
  hasRates: boolean;
};

const SectionFees = ({
  transaction,
  account,
  parentAccount,
  currency,
  status,
  updateTransaction,
  setTransaction,
  provider,
  hasRates,
}: Props) => {
  const { t } = useTranslation();
  const { setDrawer } = React.useContext(context);
  const exchangeRate = useSelector(rateSelector);
  const mainFromAccount = account && getMainAccount(account, parentAccount);
  const mainAccountUnit = mainFromAccount && getAccountUnit(mainFromAccount);
  const estimatedFees = status?.estimatedFees;
  const showSummaryValue = mainFromAccount && estimatedFees && estimatedFees.gt(0);
  const family = mainFromAccount?.currency.family;
  const sendAmountSpecific = account && family && getLLDCoinFamily(family)?.sendAmountFields;
  const canEdit =
    hasRates && showSummaryValue && transaction && account && family && sendAmountSpecific;
  const swapDefaultTrack = useGetSwapTrackingProperties();

  const StrategyIcon = useMemo(
    () =>
      (transaction?.feesStrategy &&
        FEES_STRATEGY_ICONS[transaction?.feesStrategy as keyof typeof FEES_STRATEGY_ICONS]) ||
      undefined,
    [transaction?.feesStrategy],
  );

  // Deselect slow strategy if the exchange rate is changed to fixed.
  useEffect(
    () => {
      if (exchangeRate?.tradeMethod === "fixed" && transaction?.feesStrategy === "slow") {
        updateTransaction(t => ({
          ...t,
          feesStrategy: "medium",
        }));
      }
    },
    // eslint-disable-next-line
    [transaction?.feesStrategy, exchangeRate?.tradeMethod, updateTransaction],
  );

  const handleChange = useMemo(
    () =>
      (canEdit &&
        (() => {
          track("button_clicked2", {
            button: "change network fees",
            page: "Page Swap Form",
            ...swapDefaultTrack,
          });
          setDrawer(
            FeesDrawer,
            {
              setTransaction,
              updateTransaction,
              mainAccount: mainFromAccount,
              parentAccount: parentAccount,
              currency,
              status,
              disableSlowStrategy: exchangeRate?.tradeMethod === "fixed",
              provider,
            },
            {
              forceDisableFocusTrap: true,
            },
          );
        })) ||
      undefined,
    [
      canEdit,
      swapDefaultTrack,
      setDrawer,
      setTransaction,
      updateTransaction,
      mainFromAccount,
      parentAccount,
      currency,
      status,
      exchangeRate?.tradeMethod,
      provider,
    ],
  );

  const summaryValue = canEdit ? (
    <>
      <IconSection>
        {StrategyIcon ? <StrategyIcon /> : null}
        <Text fontSize={4} fontWeight="600">
          {t(`fees.${transaction?.feesStrategy ?? "custom"}`)}
        </Text>
        <Separator />
      </IconSection>
      <FormattedVal
        color="palette.text.shade100"
        val={estimatedFees}
        unit={mainAccountUnit}
        fontSize={3}
        ff="Inter|SemiBold"
        showCode
        alwaysShowValue
      />
    </>
  ) : estimatedFees ? (
    <FormattedVal
      color="palette.text.shade100"
      val={estimatedFees}
      unit={mainAccountUnit}
      fontSize={3}
      ff="Inter|SemiBold"
      showCode
      alwaysShowValue
    />
  ) : (
    <NoValuePlaceholder />
  );

  return (
    <SummarySection>
      <SummaryLabel label={t("swap2.form.details.label.fees")} />
      <SummaryValue handleChange={handleChange}>{summaryValue}</SummaryValue>
    </SummarySection>
  );
};

export default React.memo<Props>(SectionFees);
