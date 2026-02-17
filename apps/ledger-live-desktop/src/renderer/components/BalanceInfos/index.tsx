import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Text } from "@ledgerhq/react-ui";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { AccountLike, ValueChange } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/ButtonV3";
import FormattedVal from "~/renderer/components/FormattedVal";
import PillsDaysCount from "~/renderer/components/PillsDaysCount";
import TransactionsPendingConfirmationWarning from "~/renderer/components/TransactionsPendingConfirmationWarning";
import { useResize } from "~/renderer/hooks/useResize";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import PilldDaysSelect from "../PillsDaysSelect";
import { PlaceholderLine } from "./Placeholder";

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
  counterValueId?: string;
  shouldDisplayGraphRework?: boolean;
} & BalanceSinceProps;
export function BalanceDiff({
  valueChange,
  unit,
  isAvailable,
  shouldDisplayGraphRework,
  ...boxProps
}: Props) {
  if (!isAvailable) return null;
  return (
    <Box horizontal {...boxProps}>
      <Box
        data-testid="balance-diff"
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
            percentageTwoDecimals={shouldDisplayGraphRework}
          />
        )}
        {valueChange.value === 0 ? (
          <Text color={"neutral.c100"}>{"-"}</Text>
        ) : (
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
        )}
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
              color="neutral.c100"
              unit={unit}
              fontSize={8}
              showCode
              val={totalBalance}
              dynamicSignificantDigits={dynamicSignificantDigits}
              data-testid="total-balance"
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
export default function BalanceInfos({
  totalBalance,
  valueChange,
  isAvailable,
  unit,
  counterValueId,
  shouldDisplayGraphRework,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);

  const defaultAccount = useMemo(
    () =>
      counterValueId
        ? getAvailableAccountsById(counterValueId, flattenedAccounts).find(Boolean)
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counterValueId, flattenedAccounts],
  );

  const parentAccount = useMemo(() => {
    if (defaultAccount?.type === "TokenAccount") {
      const parentId = defaultAccount.parentId;
      return flattenedAccounts.find(a => a.id === parentId);
    }
  }, [defaultAccount, flattenedAccounts]);

  // Remove "SWAP" and "BUY" redundant buttons when portafolio exchange banner is available
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const onBuy = useCallback(() => {
    setTrackingSource("Page Portfolio");
    navigate("/exchange", {
      state: {
        mode: "buy", // buy or sell
      },
    });
  }, [navigate]);
  const onSwap = useCallback(() => {
    setTrackingSource("Page Portfolio");
    navigate("/swap", {
      state: {
        from: location.pathname,
        defaultAccountId: defaultAccount?.id,
        defaultAmountFrom: "0",
        defaultParentAccountId: parentAccount?.id,
      },
    });
  }, [navigate, location, defaultAccount, parentAccount]);

  const ref = useRef<HTMLDivElement>(null);
  const { width } = useResize(ref);

  return (
    <Box flow={5} ref={ref}>
      <Box horizontal alignItems="center" justifyContent="space-between">
        <Text variant="h3Inter" fontWeight="semiBold">
          {t("dashboard.header")}
        </Text>

        {width <= 500 ? <PilldDaysSelect /> : <PillsDaysCount />}
      </Box>
      <Box horizontal>
        <BalanceTotal
          withTransactionsPendingConfirmationWarning
          unit={unit}
          isAvailable={isAvailable}
          totalBalance={totalBalance}
        />

        {!portfolioExchangeBanner?.enabled && (
          <>
            <Button data-testid="portfolio-buy-button" variant="color" mr={1} onClick={onBuy}>
              {t("accounts.contextMenu.buy")}
            </Button>
            <Button
              data-testid="portfolio-swap-button"
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

      <BalanceDiff
        totalBalance={totalBalance}
        valueChange={valueChange}
        unit={unit}
        isAvailable={isAvailable}
        shouldDisplayGraphRework={shouldDisplayGraphRework}
      />
    </Box>
  );
}
