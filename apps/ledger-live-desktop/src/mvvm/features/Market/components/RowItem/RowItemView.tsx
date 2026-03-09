import React, { memo } from "react";
import { Text, Tooltip } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { SmallMarketItemChart } from "~/renderer/screens/market/MarketList/components/MarketItemChart";
import { Button, IconButton } from "@ledgerhq/lumen-ui-react";
import { TableRow, TableCell } from "~/renderer/screens/market/components/Table";
import { formatPercentage, formatPrice } from "~/renderer/screens/market/utils";
import {
  CryptoCurrencyIconWrapper,
  CryptoNameContainer,
  EllipsisText,
  TooltipContainer,
  ActionsFullWidth,
  ActionsIconOnly,
} from "./styles";
import { RowItemViewProps, MarketActionType } from "./types";
import { Star, StarFill, Plus, Exchange, Chart5, Minus } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

const ACTION_ICONS: Record<MarketActionType, typeof Plus> = {
  buy: Plus,
  swap: Exchange,
  stake: Chart5,
  sell: Minus,
};

export const RowItemView = memo<RowItemViewProps>(function RowItemView({
  style,
  currency,
  counterCurrency,
  locale,
  isStarred,
  hasActions,
  actions,
  currentPriceChangePercentage,
  onCurrencyClick,
  onStarClick,
}: RowItemViewProps) {
  return (
    <div style={{ ...style }} className="px-20">
      <TableRow data-testid={`market-${currency.ticker}-row`} onClick={onCurrencyClick} role="row">
        <TableCell>{currency.marketcapRank ?? "-"}</TableCell>
        <TableCell>
          <CryptoCurrencyIconWrapper>
            {currency.ledgerIds && currency.ledgerIds.length > 0 && currency.ticker ? (
              <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size="32px" />
            ) : (
              <img width="32px" height="32px" src={currency.image} alt={"currency logo"} />
            )}
          </CryptoCurrencyIconWrapper>
          <CryptoNameContainer>
            <Tooltip
              content={<TooltipContainer>{currency.name}</TooltipContainer>}
              placement="top"
              arrow={false}
            >
              <EllipsisText variant="body">{currency.name}</EllipsisText>
            </Tooltip>
            <EllipsisText variant="small" color="neutral.c60">
              {currency.ticker.toUpperCase()}
            </EllipsisText>
          </CryptoNameContainer>
        </TableCell>
        <TableCell>
          {hasActions ? (
            <>
              <ActionsFullWidth>
                {actions.map(action => (
                  <Button
                    key={action.type}
                    size="sm"
                    data-testid={`market-${currency.ticker}-${action.type}-button`}
                    appearance="base"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </ActionsFullWidth>
              <ActionsIconOnly>
                {actions.map(action => (
                  <IconButton
                    key={action.type}
                    size="sm"
                    data-testid={`market-${currency.ticker}-${action.type}-button-icon`}
                    appearance="base"
                    aria-label={action.label}
                    icon={ACTION_ICONS[action.type]}
                    tooltip
                    tooltipText={action.label}
                    onClick={action.onClick}
                  />
                ))}
              </ActionsIconOnly>
            </>
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
