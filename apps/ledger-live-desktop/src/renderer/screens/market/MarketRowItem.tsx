import React, { useCallback, memo } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import styled, { useTheme } from "styled-components";
import { Flex, Text, Icon } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { swapDefaultTrack } from "~/renderer/screens/exchange/Swap2/utils/index";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { TableCell, TableRow } from "./MarketList";
import { SmallMarketItemChart } from "./MarketItemChart";
import { CurrencyData } from "@ledgerhq/live-common/market/types";
import { Button } from ".";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const CryptoCurrencyIconWrapper = styled.div`
  height: 32px;
  width: 32px;
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  img {
    object-fit: cover;
  }
`;

const EllipsisText = styled(Text)`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  currency: CurrencyData;
  counterCurrency: string;
  style: any;
  loading: boolean;
  locale: string;
  isStarred: boolean;
  toggleStar: () => void;
  selectCurrency: (currencyId: string) => void;
  availableOnBuy: boolean;
  availableOnSwap: boolean;
  range?: string;
};

function MarketRowItem({
  style,
  currency,
  counterCurrency,
  locale,
  loading,
  isStarred,
  toggleStar,
  selectCurrency,
  availableOnBuy,
  availableOnSwap,
  range,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");

  const openAddAccounts = useCallback(() => {
    if (currency)
      dispatch(
        openModal("MODAL_ADD_ACCOUNTS", {
          currency: currency.internalCurrency,
          preventSkippingCurrencySelection: true,
        }),
      );
  }, [dispatch, currency]);

  const history = useHistory();
  const { colors } = useTheme();
  const graphColor = colors.neutral.c80;
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);

  const onCurrencyClick = useCallback(() => {
    selectCurrency(currency.id, currency, range);
    setTrackingSource("Page Market");
    history.push({
      pathname: `/market/${currency.id}`,
      state: currency,
    });
  }, [currency, history, range, selectCurrency]);

  const onBuy = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource("Page Market");
      // PTX smart routing redirect to live app or to native implementation

      history.push({
        pathname: "/exchange",
        state:
          ptxSmartRouting?.enabled && currency?.internalCurrency
            ? {
                currency: currency.internalCurrency?.id,
                mode: "buy", // buy or sell
              }
            : {
                mode: "onRamp",
                defaultTicker:
                  currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
              },
      });
    },
    [currency, history, ptxSmartRouting],
  );

  const onSwap = useCallback(
    (e: any) => {
      if (currency?.internalCurrency?.id) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked", {
          button: "swap",
          currency: currency?.ticker,
          page: "Page Market",
          ...swapDefaultTrack,
        });
        setTrackingSource("Page Market");

        const currencyId = currency?.internalCurrency?.id;

        const defaultAccount = getAvailableAccountsById(currencyId, flattenedAccounts).find(
          Boolean,
        );

        if (!defaultAccount) return openAddAccounts();

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: currency.internalCurrency,
            defaultAccount,
            defaultParentAccount: defaultAccount?.parentId
              ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
              : null,
          },
        });
      }
    },
    [currency?.internalCurrency, currency?.ticker, flattenedAccounts, openAddAccounts, history],
  );

  const onStarClick = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    },
    [toggleStar],
  );

  const hasActions = currency?.internalCurrency && (availableOnBuy || availableOnSwap);

  return (
    <div style={{ ...style }}>
      {loading || !currency ? (
        <TableRow disabled>
          <TableCell loading />
          <TableCell loading />
          <TableCell loading />
          <TableCell loading />
          <TableCell loading />
          <TableCell loading />
          <TableCell loading />
        </TableRow>
      ) : (
        <TableRow data-test-id={`market-${currency?.ticker}-row`} onClick={onCurrencyClick}>
          <TableCell>{currency?.marketcapRank ?? "-"}</TableCell>
          <TableCell mr={3}>
            <CryptoCurrencyIconWrapper>
              {currency.internalCurrency ? (
                <CryptoCurrencyIcon
                  currency={currency.internalCurrency}
                  size={32}
                  circle
                  fallback={
                    <img width="32px" height="32px" src={currency.image} alt={"currency logo"} />
                  }
                />
              ) : (
                <img width="32px" height="32px" src={currency.image} alt={"currency logo"} />
              )}
            </CryptoCurrencyIconWrapper>
            <Flex
              pl={3}
              {...(hasActions ? { width: 86 } : {})}
              overflow="hidden"
              flexDirection="column"
              alignItems="left"
              pr={2}
            >
              <EllipsisText variant="body">{currency.name}</EllipsisText>
              <EllipsisText variant="small" color="neutral.c60">
                {currency.ticker.toUpperCase()}
              </EllipsisText>
            </Flex>
            {hasActions ? (
              <Flex flex={1}>
                {availableOnBuy && (
                  <Button
                    data-test-id={`market-${currency?.ticker}-buy-button`}
                    variant="color"
                    mr={1}
                    onClick={onBuy}
                  >
                    {t("accounts.contextMenu.buy")}
                  </Button>
                )}
                {availableOnSwap && (
                  <Button
                    data-test-id={`market-${currency?.ticker}-swap-button`}
                    variant="color"
                    onClick={onSwap}
                  >
                    {t("accounts.contextMenu.swap")}
                  </Button>
                )}
              </Flex>
            ) : null}
          </TableCell>
          <TableCell>
            <Text variant="body">
              {counterValueFormatter({ value: currency.price, currency: counterCurrency, locale })}
            </Text>
          </TableCell>
          <TableCell>
            {currency.priceChangePercentage ? (
              <FormattedVal
                isPercent
                isNegative
                val={parseFloat(currency.priceChangePercentage.toFixed(2))}
                inline
                withIcon
              />
            ) : (
              <Text fontWeight={"medium"}>-</Text>
            )}
          </TableCell>

          <TableCell>
            <Text>
              {counterValueFormatter({
                shorten: true,
                currency: counterCurrency,
                value: currency.marketcap,
                locale,
              })}
            </Text>
          </TableCell>
          <TableCell>
            {currency.sparklineIn7d && (
              <SmallMarketItemChart sparklineIn7d={currency.sparklineIn7d} color={graphColor} />
            )}
          </TableCell>

          <TableCell data-test-id={`market-${currency?.ticker}-star-button`} onClick={onStarClick}>
            <Icon name={isStarred ? "StarSolid" : "Star"} size={18} />
          </TableCell>
        </TableRow>
      )}
    </div>
  );
}

export default memo<Props>(MarketRowItem);
