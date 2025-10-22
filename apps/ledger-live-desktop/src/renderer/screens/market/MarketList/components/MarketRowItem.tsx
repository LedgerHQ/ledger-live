import React, { useCallback, memo } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Flex, Text, Icon, Tooltip, Box } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { SmallMarketItemChart } from "./MarketItemChart";
import { CurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { Button } from "../..";
import { useTranslation } from "react-i18next";
import { TableRow, TableCell } from "../../components/Table";
import { Page, useMarketActions } from "../../hooks/useMarketActions";
import { formatPercentage, formatPrice } from "../../utils";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

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
  currency?: CurrencyData | null;
  counterCurrency?: string;
  style: React.CSSProperties;
  loading: boolean;
  locale: string;
  isStarred: boolean;
  toggleStar: () => void;
  range?: string;
};

export const MarketRow = memo<Props>(function MarketRowItem({
  style,
  currency,
  counterCurrency,
  locale,
  loading,
  isStarred,
  toggleStar,
  range,
}: Props) {
  const history = useHistory();
  const { t } = useTranslation();

  const { onBuy, onStake, onSwap, availableOnBuy, availableOnSwap, availableOnStake } =
    useMarketActions({ currency, page: Page.Market });
  const earnStakeLabelCoin = useGetStakeLabelLocaleBased();

  const onCurrencyClick = useCallback(() => {
    if (currency) {
      setTrackingSource("Page Market");
      history.push({
        pathname: `/market/${currency.id}`,
        state: currency,
      });
    }
  }, [currency, history]);

  const onStarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    },
    [toggleStar],
  );

  const hasActions =
    currency?.internalCurrency && (availableOnBuy || availableOnSwap || availableOnStake);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const currentPriceChangePercentage = currency?.priceChangePercentage[range as KeysPriceChange];

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
        <TableRow
          data-testid={`market-${currency?.ticker}-row`}
          onClick={onCurrencyClick}
          role="row"
        >
          <TableCell>{currency?.marketcapRank ?? "-"}</TableCell>
          <TableCell mr={3}>
            <CryptoCurrencyIconWrapper>
              <img width="32px" height="32px" src={currency.image} alt={"currency logo"} />
            </CryptoCurrencyIconWrapper>
            <Tooltip
              content={<TooltipContainer>{currency.name}</TooltipContainer>}
              placement="top"
              arrow={false}
            >
              <Flex
                alignItems="left"
                justifyContent="center"
                flexDirection="column"
                mr={2}
                pl={3}
                {...(hasActions ? { width: 86 } : {})}
                overflow="hidden"
              >
                <EllipsisText variant="body">{currency.name}</EllipsisText>
                <EllipsisText variant="small" color="neutral.c60">
                  {currency.ticker.toUpperCase()}
                </EllipsisText>
              </Flex>
            </Tooltip>
            {hasActions ? (
              <Flex flex={1}>
                {availableOnBuy && (
                  <Button
                    data-testid={`market-${currency?.ticker}-buy-button`}
                    variant="color"
                    mr={1}
                    onClick={onBuy}
                  >
                    {t("accounts.contextMenu.buy")}
                  </Button>
                )}
                {availableOnSwap && (
                  <Button
                    data-testid={`market-${currency?.ticker}-swap-button`}
                    variant="color"
                    mr={1}
                    onClick={onSwap}
                  >
                    {t("accounts.contextMenu.swap")}
                  </Button>
                )}
                {availableOnStake && (
                  <Button
                    data-testid={`market-${currency?.ticker}-stake-button`}
                    variant="color"
                    onClick={e => onStake(e)}
                  >
                    {earnStakeLabelCoin}
                  </Button>
                )}
              </Flex>
            ) : null}
          </TableCell>
          <TableCell data-testid={"market-coin-price"}>
            <Text variant="body">
              {counterValueFormatter({
                value: formatPrice(currency.price ?? 0),
                currency: counterCurrency,
                locale,
              })}
            </Text>
          </TableCell>
          <TableCell data-testid={"market-price-change"}>
            {currentPriceChangePercentage ? (
              <FormattedVal
                isPercent
                isNegative
                val={formatPercentage(currentPriceChangePercentage)}
                inline
                withIcon
              />
            ) : (
              <Text fontWeight={"medium"}>-</Text>
            )}
          </TableCell>

          <TableCell data-testid={"market-cap"}>
            <Text>
              {counterValueFormatter({
                shorten: true,
                currency: counterCurrency,
                value: currency.marketcap,
                locale,
              })}
            </Text>
          </TableCell>
          <TableCell data-testid={"market-small-graph"}>
            {currency.sparklineIn7d && (
              <SmallMarketItemChart sparklineIn7d={currency.sparklineIn7d} />
            )}
          </TableCell>

          <TableCell data-testid={`market-${currency?.ticker}-star-button`} onClick={onStarClick}>
            <Icon name={isStarred ? "StarSolid" : "Star"} size={18} />
          </TableCell>
        </TableRow>
      )}
    </div>
  );
});

type CurrencyRowProps = {
  data: CurrencyData[]; // NB: CurrencyData.id is different to Currency.id
  index: number;
  counterCurrency?: string;
  loading: boolean;
  toggleStar: (id: string, isStarred: boolean) => void;
  starredMarketCoins: string[];
  locale: string;
  range?: string;
  style: React.CSSProperties;
};

export const CurrencyRow = memo(function CurrencyRowItem({
  data,
  index,
  counterCurrency,
  loading,
  toggleStar,
  starredMarketCoins,
  locale,
  style,
  range,
}: CurrencyRowProps) {
  const currency = data ? data[index] : null;
  const isStarred = currency && starredMarketCoins.includes(currency.id);

  return (
    <MarketRow
      loading={!currency || (index === data.length && index > 50 && loading)}
      currency={currency}
      counterCurrency={counterCurrency}
      isStarred={!!isStarred}
      toggleStar={() => currency?.id && toggleStar(currency.id, !!isStarred)}
      key={index}
      locale={locale}
      style={{ ...style }}
      range={range}
    />
  );
});

const TooltipContainer = styled(Box)`
  background-color: ${({ theme }) => theme.colors.palette.neutral.c100};
  padding: 10px;
  border-radius: 4px;
  display: flex;
  gap: 8px;
`;
