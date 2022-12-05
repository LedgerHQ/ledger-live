// @flow
import React, { useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { ValueChange } from "@ledgerhq/live-common/portfolio/v2/types";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import PillsDaysCount from "~/renderer/components/PillsDaysCount";
import TransactionsPendingConfirmationWarning from "~/renderer/components/TransactionsPendingConfirmationWarning";
import { swapDefaultTrack } from "~/renderer/screens/exchange/Swap2/utils/index";
import { PlaceholderLine } from "./Placeholder";

// $FlowFixMe
import Button from "~/renderer/components/ButtonV3";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useHistory } from "react-router-dom";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type BalanceSinceProps = {
  valueChange: ValueChange,
  totalBalance: number,
  isAvailable: boolean,
};

type BalanceTotalProps = {
  children?: any,
  unit?: Unit,
  isAvailable: boolean,
  totalBalance: number,
  showCryptoEvenIfNotAvailable?: boolean,
  account?: AccountLike,
  withTransactionsPendingConfirmationWarning?: boolean,
};

type Props = {
  unit: Unit,
} & BalanceSinceProps;

export function BalanceDiff({ totalBalance, valueChange, unit, isAvailable, ...boxProps }: Props) {
  if (!isAvailable) return null;

  return (
    <Box horizontal {...boxProps}>
      <Box horizontal alignItems="center" style={{ lineHeight: 1.2, fontSize: 20 }}>
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
  const { t } = useTranslation();
  const history = useHistory();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");

  const onBuy = useCallback(() => {
    setTrackingSource("Page Portfolio");

    history.push({
      pathname: "/exchange",
      state: ptxSmartRouting?.enabled
        ? {
            mode: "buy", // buy or sell
          }
        : undefined,
    });
  }, [history, ptxSmartRouting]);

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
        <Button data-test-id="portfolio-buy-button" variant="color" mr={1} onClick={onBuy}>
          {t("accounts.contextMenu.buy")}
        </Button>

        <Button
          data-test-id="portfolio-swap-button"
          variant="color"
          event="button_clicked"
          eventProperties={{
            button: "swap",
            page: "Page Portfolio",
            ...swapDefaultTrack,
          }}
          onClick={onSwap}
        >
          {t("accounts.contextMenu.swap")}
        </Button>
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
