import React, { useCallback, memo } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Flex, Text, Icon, Tooltip, Box } from "@ledgerhq/react-ui";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";

import { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { Button } from "../..";
import { useTranslation } from "react-i18next";
import { TableRow, TableCell } from "../../components/Table";
import { formatPercentage, formatPrice } from "../../utils";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import FormattedVal from "~/renderer/components/FormattedVal";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useMarketActions, Page } from "../../hooks/useMarketActions";
import { SimpleSparkline } from "./SimpleSparkline";

const EllipsisText = styled(Text)`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  item: {
    currency: CryptoOrTokenCurrency;
    market: Partial<MarketItemResponse>;
    asset: {
      id: string;
      ticker: string;
      name: string;
      assetsIds: Record<string, string>;
      metaCurrencyId?: string;
    };
  } | null;
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
  item,
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
    useMarketActions({ currency: item?.currency, page: Page.Market });
  const earnStakeLabelCoin = useGetStakeLabelLocaleBased();

  const onCurrencyClick = useCallback(() => {
    if (item) {
      setTrackingSource("Page Market");
      history.push({
        pathname: `/market/${item.currency.id}`,
        state: item.currency,
      });
    }
  }, [item, history]);

  const onStarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStar();
    },
    [toggleStar],
  );

  const hasActions = availableOnBuy || availableOnSwap || availableOnStake;

  const { currency, market } = item ?? {};

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const currentPriceChangePercentage = market?.[
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    `priceChangePercentage${range}` as keyof MarketItemResponse
  ] as number;

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
          <TableCell>{market?.marketCapRank ?? "-"}</TableCell>
          <TableCell mr={3}>
            <CryptoIcon size="48px" ledgerId={currency?.id} ticker={currency?.ticker} />

            <Tooltip
              content={<TooltipContainer>{currency?.name}</TooltipContainer>}
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
                <EllipsisText variant="body">{currency?.name}</EllipsisText>
                <EllipsisText variant="small" color="neutral.c60">
                  {currency?.ticker.toUpperCase()}
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
                value: formatPrice(market?.price ?? 0),
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
                value: market?.marketCap,
                locale,
              })}
            </Text>
          </TableCell>
          <TableCell data-testid={"market-small-graph"}>
            {market?.sparkline && <SimpleSparkline data={market.sparkline} />}
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
  data: {
    currency: CryptoOrTokenCurrency;
    market: Partial<MarketItemResponse>;
    asset: {
      id: string;
      ticker: string;
      name: string;
      assetsIds: Record<string, string>;
      metaCurrencyId?: string;
    };
  }[]; // NB: CurrencyData.id is different to Currency.id
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
  const isStarred = currency && starredMarketCoins.includes(currency.asset.id);

  return (
    <MarketRow
      loading={!currency || (index === data.length && index > 50 && loading)}
      item={currency}
      counterCurrency={counterCurrency}
      isStarred={!!isStarred}
      toggleStar={() => currency?.asset.id && toggleStar(currency.asset.id, !!isStarred)}
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
