import React, { memo } from "react";
import { Flex, Text, Tooltip } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { SmallMarketItemChart } from "~/renderer/screens/market/MarketList/components/MarketItemChart";
import { Button } from "@ledgerhq/lumen-ui-react";
import { TableRow, TableCell } from "~/renderer/screens/market/components/Table";
import { formatPercentage, formatPrice } from "~/renderer/screens/market/utils";
import { CryptoCurrencyIconWrapper, EllipsisText, TooltipContainer } from "./styles";
import { RowItemViewProps } from "./types";
import { Star, StarFill } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

export const RowItemView = memo<RowItemViewProps>(function RowItemView({
  style,
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
}: RowItemViewProps) {
  return (
    <div style={{ ...style }} className="px-20">
      <TableRow data-testid={`market-${currency.ticker}-row`} onClick={onCurrencyClick} role="row">
        <TableCell>{currency.marketcapRank ?? "-"}</TableCell>
        <TableCell mr={3}>
          <CryptoCurrencyIconWrapper>
            {currency.ledgerIds && currency.ledgerIds.length > 0 && currency.ticker ? (
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
            <div className="flex flex-1 gap-8">
              {availableOnBuy && (
                <Button
                  size="sm"
                  data-testid={`market-${currency.ticker}-buy-button`}
                  appearance="base"
                  onClick={onBuy}
                >
                  {buyLabel}
                </Button>
              )}
              {availableOnSwap && (
                <Button
                  size="sm"
                  data-testid={`market-${currency.ticker}-swap-button`}
                  appearance="base"
                  onClick={onSwap}
                >
                  {swapLabel}
                </Button>
              )}
              {availableOnStake && (
                <Button
                  size="sm"
                  data-testid={`market-${currency.ticker}-stake-button`}
                  appearance="base"
                  onClick={onStake}
                >
                  {earnStakeLabelCoin}
                </Button>
              )}
            </div>
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

        <TableCell data-testid={`market-${currency.ticker}-star-button`} onClick={onStarClick}>
          {isStarred ? <StarFill size={16} /> : <Star size={16} style={{ fill: "none" }} />}
        </TableCell>
      </TableRow>
    </div>
  );
});
