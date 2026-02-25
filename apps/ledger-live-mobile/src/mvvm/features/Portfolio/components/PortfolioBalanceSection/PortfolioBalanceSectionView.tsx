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
  paddingBottom: "s64",
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

  const getTestId = (): string => {
    if (state === "noSigner" || state === "noFund") {
      return `portfolio-balance-${state}`;
    }
    return isBalanceAvailable ? "portfolio-balance-normal" : "portfolio-balance-loading";
  };

  const renderContent = () => {
    if (state === "noSigner" || state === "noFund") {
      return (
        <Text
          typography="heading1SemiBold"
          lx={{ color: "base", textAlign: "center" }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {t(`portfolio.balance.${state}`)}
        </Text>
      );
    }

    return (
      <>
        <Pressable onPress={onToggleDiscreetMode} testID="portfolio-balance-toggle">
          <Box lx={{ flexDirection: "row", alignItems: "baseline", gap: "s14" }}>
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
        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: "s12",
            minHeight: isBalanceAvailable ? undefined : "s24",
          }}
        >
          {isBalanceAvailable ? (
            <AnalyticPill valueChange={countervalueChange} />
          ) : (
            <InfiniteLoader size={20} />
          )}
        </Box>
      </>
    );
  };

  return (
    <Box lx={containerStyle} testID={getTestId()}>
      {renderContent()}
    </Box>
  );
};
