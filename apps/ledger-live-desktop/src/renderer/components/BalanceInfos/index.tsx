import React, { useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { AccountLike, ValueChange } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import PillsDaysCount from "~/renderer/components/PillsDaysCount";
import TransactionsPendingConfirmationWarning from "~/renderer/components/TransactionsPendingConfirmationWarning";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import { PlaceholderLine } from "./Placeholder";
import Button from "~/renderer/components/ButtonV3";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useHistory } from "react-router-dom";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";

type BalanceSinceProps = {
  valueChange: ValueChange;
  totalBalance: number;
  isAvailable: boolean;
};
type BalanceTotalProps = {
  children?: React.ReactNode;
  unit?: Unit;
  isAvailable: boolean;
  totalBalance: number;
  showCryptoEvenIfNotAvailable?: boolean;
  account?: AccountLike;
  withTransactionsPendingConfirmationWarning?: boolean;
  dynamicSignificantDigits?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
};
type Props = {
  unit: Unit;
} & BalanceSinceProps;
export function BalanceDiff({ valueChange, unit, isAvailable, ...boxProps }: Props) {
  if (!isAvailable) return null;
  return (
    <Box horizontal {...boxProps}>
      <Box
        horizontal
        alignItems="center"
        style={{
          lineHeight: 1.2,
          fontSize: 20,
        }}
      >
        {typeof valueChange.percentage === "number" && (
          <FormattedVal
            isPercent
            animateTicker
            val={Math.round(valueChange.percentage * 100)}
            inline
            withIcon
          />
        )}
        <FormattedVal
          unit={unit}
          val={valueChange.value}
          prefix={valueChange.percentage ? " (" : undefined}
          suffix={valueChange.percentage ? ")" : undefined}
          withIcon={!valueChange.percentage}
          alwaysShowSign={!!valueChange.percentage}
          showCode
          animateTicker
          inline
        />
      </Box>
    </Box>
  );
}
export function BalanceTotal({
  unit,
  totalBalance,
  isAvailable,
  showCryptoEvenIfNotAvailable,
  children = null,
  withTransactionsPendingConfirmationWarning,
  account,
  dynamicSignificantDigits,
  ...boxProps
}: BalanceTotalProps) {
  return (
    <Box horizontal grow shrink>
      <Box {...boxProps}>
        <Box horizontal>
          {!isAvailable && !showCryptoEvenIfNotAvailable ? (
            <PlaceholderLine width={150} />
          ) : (
            <FormattedVal
              inline
              animateTicker
              color="palette.text.shade100"
              unit={unit}
              fontSize={8}
              showCode
              val={totalBalance}
              dynamicSignificantDigits={dynamicSignificantDigits}
              data-test-id="total-balance"
            />
          )}
          {withTransactionsPendingConfirmationWarning ? (
            <TransactionsPendingConfirmationWarning maybeAccount={account} />
          ) : null}
        </Box>
        {(isAvailable || showCryptoEvenIfNotAvailable) && children}
      </Box>
    </Box>
  );
}
export default function BalanceInfos({ totalBalance, valueChange, isAvailable, unit }: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const { t } = useTranslation();
  const history = useHistory();

  // Remove "SWAP" and "BUY" redundant buttons when portafolio exchange banner is available
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const onBuy = useCallback(() => {
    setTrackingSource("Page Portfolio");
    history.push({
      pathname: "/exchange",
      state: {
        mode: "buy", // buy or sell
      },
    });
  }, [history]);
  const onSwap = useCallback(() => {
    setTrackingSource("Page Portfolio");
    history.push({
      pathname: "/swap",
    });
  }, [history]);
  return (
    <Box flow={5}>
      <Box horizontal>
        <BalanceTotal
          withTransactionsPendingConfirmationWarning
          unit={unit}
          isAvailable={isAvailable}
          totalBalance={totalBalance}
        >
          <Sub>{t("dashboard.totalBalance")}</Sub>
        </BalanceTotal>
        {!portfolioExchangeBanner?.enabled && (
          <>
            <Button data-test-id="portfolio-buy-button" variant="color" mr={1} onClick={onBuy}>
              {t("accounts.contextMenu.buy")}
            </Button>
            <Button
              data-test-id="portfolio-swap-button"
              variant="color"
              event="button_clicked2"
              eventProperties={{
                button: "swap",
                page: "Page Portfolio",
                ...swapDefaultTrack,
              }}
              onClick={onSwap}
            >
              {t("accounts.contextMenu.swap")}
            </Button>
          </>
        )}
      </Box>
      <Box horizontal alignItems="center" justifyContent="space-between">
        <BalanceDiff
          totalBalance={totalBalance}
          valueChange={valueChange}
          unit={unit}
          isAvailable={isAvailable}
        />
        <PillsDaysCount />
      </Box>
    </Box>
  );
}
const Sub = styled(Box).attrs(() => ({
  ff: "Inter",
  fontSize: 4,
}))`
  text-transform: lowercase;
`;
