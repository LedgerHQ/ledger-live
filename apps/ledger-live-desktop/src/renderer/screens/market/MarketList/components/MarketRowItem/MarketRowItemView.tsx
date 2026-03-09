import React, { memo } from "react";
import { Text, Icon, Tooltip } from "@ledgerhq/react-ui";
import FormattedVal from "~/renderer/components/FormattedVal";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { SmallMarketItemChart } from "../MarketItemChart";
import { Button } from "../../..";
import { TableRow, TableCell, TablePlaceholder } from "../../../components/Table";
import { formatPercentage, formatPrice } from "../../../utils";
import {
  CryptoCurrencyIconWrapper,
  CryptoNameContainer,
  EllipsisText,
  TooltipContainer,
  ActionsFullWidth,
  ActionsIconOnly,
} from "LLD/features/Market/components/RowItem/styles";
import { RowItemViewProps, MarketActionType } from "LLD/features/Market/components/RowItem/types";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

const ACTION_ICONS: Record<MarketActionType, string> = {
  buy: "Plus",
  swap: "Trade",
  stake: "GraphGrow",
  sell: "Minus",
};

type MarketRowItemViewProps = RowItemViewProps & {
  loading: boolean;
};

export const MarketRowItemView = memo<MarketRowItemViewProps>(function MarketRowItemView({
  style,
  loading,
  currency,
  counterCurrency,
  locale,
  isStarred,
  hasActions,
  actions,
  currentPriceChangePercentage,
  onCurrencyClick,
  onStarClick,
}: MarketRowItemViewProps) {
  return (
    <div style={{ ...style }}>
      {loading || !currency ? (
        <TablePlaceholder size={8} />
      ) : (
        <TableRow
          data-testid={`market-${currency?.ticker}-row`}
          onClick={onCurrencyClick}
          role="row"
        >
          <TableCell>{currency?.marketcapRank ?? "-"}</TableCell>
          <TableCell>
            <CryptoCurrencyIconWrapper>
              {currency.ledgerIds && currency.ledgerIds.length > 0 ? (
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
                      data-testid={`market-${currency?.ticker}-${action.type}-button`}
                      variant="color"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </ActionsFullWidth>
                <ActionsIconOnly>
                  {actions.map(action => (
                    <Tooltip
                      key={action.type}
                      content={<TooltipContainer>{action.label}</TooltipContainer>}
                      placement="top"
                      arrow={false}
                    >
                      <Button
                        data-testid={`market-${currency?.ticker}-${action.type}-button`}
                        variant="color"
                        onClick={action.onClick}
                      >
                        <Icon name={ACTION_ICONS[action.type]} size={16} />
                      </Button>
                    </Tooltip>
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

          <TableCell data-testid={`market-${currency?.ticker}-star-button`} onClick={onStarClick}>
            <Icon name={isStarred ? "StarSolid" : "Star"} size={18} />
          </TableCell>
        </TableRow>
      )}
    </div>
  );
});
