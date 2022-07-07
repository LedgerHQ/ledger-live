// @flow

import React, { forwardRef } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import Text from "~/renderer/components/Text";
import styled from "styled-components";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import type { Currency } from "@ledgerhq/live-common/types/index";
import Box from "~/renderer/components/Box";
import { RowContainer, RowInnerContainer, CurrencyLabel } from "./shared";

type Props = {
  currencies: Currency[],
  onCurrencySelect: (currency: Currency) => void,
};

const CurrencyListContainer = styled.div`
  flex: 1 1 auto;
  width: 100%;
`;

const CustomListContainer = styled.div`
  &::-webkit-scrollbar {
    display: none;
  }
`;

const outerElementType = forwardRef((props, ref) => <CustomListContainer ref={ref} {...props} />);
outerElementType.displayName = "outerElementType";

export function CurrencyList({ currencies, onCurrencySelect }: Props) {
  return (
    <CurrencyListContainer>
      <AutoSizer style={{ height: "100%", width: "100%" }}>
        {({ height }: { height: number }) => (
          <List
            outerElementType={outerElementType}
            height={height}
            itemCount={currencies.length}
            itemSize={52}
            width="100%"
          >
            {({ index, style }: any) => {
              const currency = currencies[index];
              return (
                <RowContainer key={index} style={style} onClick={() => onCurrencySelect(currency)}>
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
                        style={{ marginLeft: 4, textTransform: "uppercase" }}
                      >
                        {currency.ticker}
                      </Text>
                    </Box>
                    {currency.parentCurrency ? (
                      <Box horizontal alignItems="center" marginLeft="12px">
                        <CurrencyLabel>{currency.parentCurrency.name}</CurrencyLabel>
                      </Box>
                    ) : null}
                  </RowInnerContainer>
                </RowContainer>
              );
            }}
          </List>
        )}
      </AutoSizer>
    </CurrencyListContainer>
  );
}
