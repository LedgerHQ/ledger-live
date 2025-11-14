import React, { useCallback } from "react";
import Text from "~/renderer/components/Text";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import { RowContainer, RowInnerContainer, CurrencyLabel } from "./shared";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls/index";
import { ListWrapper } from "~/newArch/features/ModularDrawer/components/ListWrapper";
type Props = {
  currencies: CryptoOrTokenCurrency[];
  onCurrencySelect: (currency: CryptoOrTokenCurrency) => void;
  onVisibleItemsScrollEnd?: () => void;
  hasNextPage?: boolean;
};

const TITLE_HEIGHT = 108;
const SEARCH_HEIGHT = 64;
const MARGIN_BOTTOM = TITLE_HEIGHT + SEARCH_HEIGHT;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export function CurrencyList({
  currencies,
  onCurrencySelect,
  onVisibleItemsScrollEnd,
  hasNextPage,
}: Props) {
  const renderCurrencyItem = useCallback(
    (currency: CryptoOrTokenCurrency) => (
      <RowContainer
        key={currency.id}
        onClick={() => onCurrencySelect(currency)}
        data-testid={`currency-row-${currency?.name?.toLowerCase()}`}
      >
        <RowInnerContainer>
          <Box
            horizontal
            alignItems="center"
            style={{
              flexShrink: 1,
            }}
          >
            <CryptoCurrencyIcon circle currency={currency} size={24} />
            <Text
              ff="Inter|SemiBold"
              color="inherit"
              fontSize="13px"
              style={{
                marginLeft: 12,
                textOverflow: "ellipsis",
                flexShrink: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {currency.name}
            </Text>
            <Text
              ff="Inter|Medium"
              color="palette.text.shade50"
              fontSize="13px"
              style={{
                marginLeft: 4,
                textTransform: "uppercase",
              }}
            >
              {currency.ticker}
            </Text>
          </Box>
          {currency.type === "TokenCurrency" && currency.parentCurrency ? (
            <Box horizontal alignItems="center" marginLeft="12px">
              <CurrencyLabel>{currency.parentCurrency.name}</CurrencyLabel>
            </Box>
          ) : null}
        </RowInnerContainer>
      </RowContainer>
    ),
    [onCurrencySelect],
  );

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <VirtualList
        items={currencies}
        itemHeight={52}
        renderItem={renderCurrencyItem}
        onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
        hasNextPage={hasNextPage}
      />
    </ListWrapper>
  );
}
