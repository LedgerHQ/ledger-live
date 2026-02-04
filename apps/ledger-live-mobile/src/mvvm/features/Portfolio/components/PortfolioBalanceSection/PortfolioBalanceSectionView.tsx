import React, { useCallback } from "react";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import { AmountDisplay, Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { DiscreetModeIcon } from "./DiscreetModeIcon";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { discreetModeSelector } from "~/reducers/settings";
import { PortfolioBalanceSectionViewProps } from "./types";
import { AnalyticPill } from "./AnalyticPill";

const containerStyle: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingTop: "s56",
};

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginTop: "s12",
};

export const PortfolioBalanceSectionView = ({
  state,
  balance,
  countervalueChange,
  unit,
  isBalanceAvailable,
  onToggleDiscreetMode,
}: PortfolioBalanceSectionViewProps) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);

  const formatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  const getBalanceIndicator = () => {
    if (!isBalanceAvailable) {
      return <InfiniteLoader size={20} />;
    }
    return <AnalyticPill valueChange={countervalueChange} />;
  };

  if (state === "noSigner" || state === "noFund") {
    return (
      <Box lx={containerStyle} testID={`portfolio-balance-${state}`}>
        <Text
          typography="heading1SemiBold"
          lx={{ color: "base", textAlign: "center" }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {t(`portfolio.balance.${state}`)}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      lx={{ ...containerStyle, paddingBottom: "s64" }}
      testID={isBalanceAvailable ? "portfolio-balance-normal" : "portfolio-balance-loading"}
    >
      <Pressable onPress={onToggleDiscreetMode} testID="portfolio-balance-toggle">
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
          <AmountDisplay
            key={unit.code}
            value={isBalanceAvailable ? balance : 0}
            formatter={formatter}
            hidden={!isBalanceAvailable || discreet}
            testID="portfolio-balance-amount"
          />
          {discreet && <DiscreetModeIcon />}
        </Box>
      </Pressable>
      <Box lx={{ ...rowStyle, ...(!isBalanceAvailable && { minHeight: "s24" }) }}>
        {getBalanceIndicator()}
      </Box>
    </Box>
  );
};
