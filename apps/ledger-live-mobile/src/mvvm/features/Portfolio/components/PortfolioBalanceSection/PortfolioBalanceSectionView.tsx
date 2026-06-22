import React, { useCallback } from "react";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { FittedAmountDisplay } from "LLM/components/FittedAmountDisplay";
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

const DISCREET_ICON_RESERVED_WIDTH = 38;

const containerStyle: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "center",
};

export const PortfolioBalanceSectionView = ({
  state,
  balance,
  countervalueChange,
  unit,
  isBalanceAvailable,
  isAnalyticPillVisible,
  isLoading,
  shouldDisplayBalanceRefreshRework,
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
    if (state === "noSigner" || state === "noAccounts") {
      return `portfolio-balance-${state}`;
    }
    return isBalanceAvailable ? "portfolio-balance-normal" : "portfolio-balance-loading";
  };

  const renderAnalyticPill = () => {
    if (!isAnalyticPillVisible) return null;
    return (
      <Box lx={{ flexDirection: "row", alignItems: "center", marginTop: "s12" }}>
        <AnalyticPill valueChange={countervalueChange} />
      </Box>
    );
  };

  const renderBalance = () => {
    if (!isBalanceAvailable) {
      return (
        <Skeleton testID="portfolio-placeholder-balance" lx={{ height: "s48", width: "s256" }} />
      );
    }

    return (
      <FittedAmountDisplay
        key={unit.code}
        value={balance}
        formatter={formatter}
        hidden={discreet}
        loading={shouldDisplayBalanceRefreshRework && isLoading}
        reservedTrailingWidth={discreet ? DISCREET_ICON_RESERVED_WIDTH : 0}
        testID="portfolio-balance-amount"
      />
    );
  };

  const renderContent = () => {
    if (state === "noSigner" || state === "noAccounts") {
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
          <Box
            lx={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "center",
              gap: "s14",
            }}
          >
            {renderBalance()}
            {discreet && <DiscreetModeIcon />}
          </Box>
        </Pressable>
        {renderAnalyticPill()}
      </>
    );
  };

  return (
    <Box lx={containerStyle} testID={getTestId()}>
      {renderContent()}
    </Box>
  );
};
