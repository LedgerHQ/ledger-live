import React, { useCallback, useEffect, useMemo } from "react";
import { getAccountSpendableBalance } from "@ledgerhq/live-common/account/index";
import { useDispatch, useSelector } from "react-redux";
import { Currency, CryptoCurrency, TokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";

import { setCountervalueFirst } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { BalanceTotal, BalanceDiff } from "~/renderer/components/BalanceInfos";
import Box, { Tabbable } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Price from "~/renderer/components/Price";
import PillsDaysCount from "~/renderer/components/PillsDaysCount";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import styled from "styled-components";
import Swap from "~/renderer/icons/Swap";
import Button from "~/renderer/components/ButtonV3";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import useStakeFlow from "~/renderer/screens/stake";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { AccountLike, BalanceHistoryWithCountervalue, ValueChange } from "@ledgerhq/types-live";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useStake } from "LLD/hooks/useStake";
type Props = {
  isAvailable: boolean;
  cryptoChange: ValueChange;
  countervalueChange: ValueChange;
  last: BalanceHistoryWithCountervalue[0];
  counterValue: Currency;
  countervalueFirst: boolean;
  currency: CryptoCurrency | TokenCurrency;
  unit: Unit;
  account: AccountLike;
};
export default function AssetBalanceSummaryHeader({
  counterValue,
  isAvailable,
  last,
  cryptoChange,
  countervalueChange,
  countervalueFirst,
  currency,
  unit,
  account,
}: Props) {
  const { data: currenciesAll } = useFetchCurrencyAll();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const flattenAccounts = useSelector(flattenAccountsSelector);

  const cvUnit = counterValue.units[0];
  const data = useMemo(
    () => [
      {
        valueChange: cryptoChange,
        balance: last.value,
        unit,
      },
      {
        valueChange: countervalueChange,
        balance: last.countervalue,
        unit: cvUnit,
      },
    ],
    [countervalueChange, cryptoChange, cvUnit, last.countervalue, last.value, unit],
  );
  useEffect(() => {
    if (countervalueFirst) {
      data.reverse();
    }
  }, [countervalueFirst, data]);

  const parentAccount = useMemo(() => {
    if (account.type === "TokenAccount") {
      return flattenAccounts.find(a => a.id === account.parentId);
    }
  }, [account, flattenAccounts]);

  const primaryKey = data[0].unit.code;
  const secondaryKey = data[1].unit.code;
  const { isCurrencyAvailable } = useRampCatalog();

  const availableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");

  const startStakeFlow = useStakeFlow();
  const { getCanStakeCurrency } = useStake();
  const balance = getAccountSpendableBalance(account);
  const isZeroBalance = balance.isZero();

  const availableOnStake = getCanStakeCurrency(currency?.id);
  const earnStakeLabelCoin = useGetStakeLabelLocaleBased();

  const availableOnSwap = currenciesAll.includes(currency.id);

  const onBuy = useCallback(() => {
    setTrackingSource("asset header actions");
    history.push({
      pathname: "/exchange",
      state: {
        currency: currency?.id,
        mode: "buy", // buy or sell
      },
    });
  }, [currency.id, history]);

  const onSwap = useCallback(() => {
    track("button_clicked2", {
      button: "swap",
      currency: currency?.ticker,
      page: "Page Asset",
      ...swapDefaultTrack,
    });
    setTrackingSource("Page Asset");
    history.push({
      pathname: "/swap",
      state: {
        defaultAccount: account,
        defaultParentAccount: parentAccount,
        defaultCurrency: currency,
        defaultAmountFrom: "0",
        from: history.location.pathname,
      },
    });
  }, [currency, swapDefaultTrack, history, account, parentAccount]);

  const onStake = useCallback(() => {
    track("button_clicked2", {
      button: "stake",
      currency: currency?.ticker,
      page: "Page Asset",
      ...stakeDefaultTrack,
    });
    setTrackingSource("Page Asset");
    startStakeFlow({
      currencies: currency ? [currency.id] : undefined,
      alwaysShowNoFunds: isZeroBalance,
    });
  }, [currency, isZeroBalance, startStakeFlow]);

  return (
    <Box flow={5}>
      <Box horizontal>
        {isAvailable && (
          <SwapButton onClick={() => dispatch(setCountervalueFirst(!countervalueFirst))}>
            <Swap />
          </SwapButton>
        )}
        <BalanceTotal
          key={primaryKey}
          style={{
            cursor: isAvailable ? "pointer" : "",
            overflow: "hidden",
            flexShrink: 1,
          }}
          onClick={() => setCountervalueFirst(!countervalueFirst)}
          showCryptoEvenIfNotAvailable
          isAvailable={isAvailable}
          totalBalance={data[0].balance || 0}
          unit={data[0].unit}
        >
          <Wrapper
            style={{
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: "auto",
                marginRight: 20,
              }}
            >
              {typeof data[1].balance === "number" && (
                <FormattedVal
                  key={secondaryKey}
                  animateTicker
                  disableRounding
                  alwaysShowSign={false}
                  color="warmGrey"
                  unit={data[1].unit}
                  fontSize={6}
                  showCode
                  val={data[1].balance}
                />
              )}
            </div>
            <Price
              unit={unit}
              from={currency}
              withActivityCurrencyColor
              withEquality
              fontSize={6}
              iconSize={16}
            />
          </Wrapper>
        </BalanceTotal>
        {availableOnBuy && (
          <Button buttonTestId="asset-page-buy-button" variant="color" mr={1} onClick={onBuy}>
            {t("accounts.contextMenu.buy")}
          </Button>
        )}

        {availableOnSwap && (
          <Button buttonTestId="asset-page-swap-button" variant="color" mr={1} onClick={onSwap}>
            {t("accounts.contextMenu.swap")}
          </Button>
        )}

        {availableOnStake && (
          <Button variant="color" onClick={onStake} buttonTestId="asset-page-stake-button">
            {earnStakeLabelCoin}
          </Button>
        )}
      </Box>
      <Box
        key={primaryKey}
        horizontal
        alignItems="center"
        justifyContent={isAvailable ? "space-between" : "flex-end"}
        flow={7}
      >
        <BalanceDiff
          totalBalance={data[0].balance || 0}
          valueChange={data[0].valueChange}
          unit={data[0].unit}
          isAvailable={isAvailable}
        />
        <PillsDaysCount />
      </Box>
    </Box>
  );
}
const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: row;
`;
const SwapButton = styled(Tabbable).attrs(() => ({
  color: "palette.text.shade100",
  ff: "Inter",
  fontSize: 7,
}))`
  align-items: center;
  align-self: center;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  color: ${p => p.theme.colors.palette.divider};
  cursor: pointer;
  display: flex;
  height: 53px;
  justify-content: center;
  margin-right: 16px;
  width: 25px;

  &:hover {
    border-color: ${p => p.theme.colors.palette.text.shade100};
    color: ${p => p.theme.colors.palette.text.shade100};
  }

  &:active {
    opacity: 0.5;
  }
`;
