import React from "react";
import { PropsBody, PropsBodyElem } from "./types";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled from "@ledgerhq/react-ui/components/styled";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import FormattedVal from "~/renderer/components/FormattedVal";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const LIMIT = 5;

export function WidgetList({ data, order }: PropsBody) {
  const start = order === "asc" ? 0 : data.length - LIMIT;
  const end = order === "asc" ? LIMIT : data.length;
  return (
    <Flex flexDirection={"column"} flex={1}>
      {data.slice(start, end).map((elem, i) => (
        <WidgetRow key={i} index={i + 1} data={elem} isFirst={i === 0} />
      ))}
    </Flex>
  );
}

function WidgetRow({ data, index, isFirst }: PropsBodyElem) {
  const { currency, change } = data;

  const cryptCurrency = currency as CryptoCurrency;

  return (
    <Flex alignItems="center" mt={isFirst ? 0 : 2} justifyContent={"space-between"}>
      <Flex alignItems="center">
        <Text color="neutral.c80" variant="h5Inter" mr={2}>
          {index}
        </Text>
        <CryptoCurrencyIconWrapper>
          <CryptoCurrencyIcon
            currency={currency}
            size={32}
            circle
            fallback={
              <img width="32px" height="32px" src={cryptCurrency.ticker} alt={"currency logo"} />
            }
          />
        </CryptoCurrencyIconWrapper>

        <Flex ml={2} overflow="hidden" flexDirection="column" alignItems="left">
          <EllipsisText variant="paragraph" fontWeight="semiBold" color="neutral.c100">
            {cryptCurrency.name}
          </EllipsisText>
          <EllipsisText variant="small" color="neutral.c60">
            {cryptCurrency.ticker.toUpperCase()}
          </EllipsisText>
        </Flex>
      </Flex>
      <Flex flexDirection="column">
        <EllipsisText variant="h3Inter" textAlign="right">
          <FormattedVal
            isPercent
            isNegative
            val={parseFloat((Math.round(change * 10000) / 100).toFixed(2))}
            inline
            withIcon
          />
        </EllipsisText>
        <EllipsisText variant="h5Inter" color="neutral.c100" textAlign="right">
          $30,004.34
          {/* {counterValueFormatter({ value: currentValue, currency: counterCurrency, locale })} */}
        </EllipsisText>
      </Flex>
    </Flex>
  );
}

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
