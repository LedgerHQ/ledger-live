import React, { memo } from "react";
import { Flex, Text, Icon, Tooltip } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { SmallMarketItemChart } from "../MarketItemChart";
import { Button } from "../../..";
import { TableRow, TableCell, TablePlaceholder } from "../../../components/Table";
import { formatPercentage, formatPrice } from "../../../utils";
import {
  CryptoCurrencyIconWrapper,
  EllipsisText,
  TooltipContainer,
} from "LLD/features/Market/components/MarketRowItem/styles";
import { MarketRowItemViewProps } from "LLD/features/Market/components/MarketRowItem/types";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

export const MarketRowItemView = memo<MarketRowItemViewProps>(function MarketRowItemView({
  style,
  loading,
  currency,
  counterCurrency,
  locale,
  isStarred,
  hasActions,
  currentPriceChangePercentage,
  earnStakeLabelCoin,
  availableOnBuy,
  availableOnSwap,
  availableOnStake,
  buyLabel,
  swapLabel,
  onCurrencyClick,
  onStarClick,
  onBuy,
  onSwap,
  onStake,
}: MarketRowItemViewProps) {
  return (
    <div style={{ ...style }}>
      {loading || !currency ? (
        <TablePlaceholder size={7} />
      ) : (
        <TableRow
          data-testid={`market-${currency?.ticker}-row`}
          onClick={onCurrencyClick}
          role="row"
        >
          <TableCell>{currency?.marketcapRank ?? "-"}</TableCell>
          <TableCell mr={3}>
            <CryptoCurrencyIconWrapper>
              {currency.ledgerIds && currency.ledgerIds.length > 0 ? (
                <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size="32px" />
              ) : (
                <img width="32px" height="32px" src={currency.image} alt={"currency logo"} />
              )}
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
                    {buyLabel}
                  </Button>
                )}
                {availableOnSwap && (
                  <Button
                    data-testid={`market-${currency?.ticker}-swap-button`}
                    variant="color"
                    mr={1}
                    onClick={onSwap}
                  >
                    {swapLabel}
                  </Button>
                )}
                {availableOnStake && (
                  <Button
                    data-testid={`market-${currency?.ticker}-stake-button`}
                    variant="color"
                    onClick={onStake}
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
