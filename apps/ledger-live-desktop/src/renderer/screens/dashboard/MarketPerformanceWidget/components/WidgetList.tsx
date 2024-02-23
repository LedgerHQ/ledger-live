import React from "react";
import { PropsBody, PropsBodyElem } from "../types";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled from "@ledgerhq/react-ui/components/styled";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import FormattedVal from "~/renderer/components/FormattedVal";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import { usePrice } from "~/renderer/hooks/usePrice";
import { MissingData } from "./MissingData";
import { fontSizes } from "@ledgerhq/react-ui/styles/theme";

export function WidgetList({ data, order }: PropsBody) {
  const noData = data.length === 0;

  return (
    <Flex flexDirection="column" flex={1} height={275}>
      {noData ? (
        <MissingData order={order} />
      ) : (
        data.map((elem, i) => <WidgetRow key={i} index={i + 1} data={elem} isFirst={i === 0} />)
      )}
    </Flex>
  );
}

function WidgetRow({ data, index, isFirst }: PropsBodyElem) {
  const { currency, change } = data;

  const cryptCurrency = currency as CryptoCurrency;
  const { counterValue, counterValueCurrency } = usePrice(cryptCurrency);
  const subMagnitude = counterValue && counterValue.lt(1) ? 1 : 0;

  return (
    <Flex alignItems="center" mt={isFirst ? 0 : 2} justifyContent="space-between">
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
          <EllipsisText
            variant="paragraph"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={fontSizes.paragraph}
          >
            {cryptCurrency.name}
          </EllipsisText>

          <EllipsisText
            variant="small"
            color="neutral.c60"
            fontWeight="medium"
            fontSize={fontSizes.small}
          >
            {cryptCurrency.ticker.toUpperCase()}
          </EllipsisText>
        </Flex>
      </Flex>

      <Flex flexDirection="column">
        <FormattedVal
          isPercent
          isNegative
          val={parseFloat((Math.round(change * 10000) / 100).toFixed(2))}
          inline
          withIcon
          style={{
            fontSize: fontSizes.paragraph,
            fontWeight: "medium",
          }}
        />

        <EllipsisText
          variant="small"
          textAlign="right"
          color="neutral.c100"
          fontWeight="medium"
          fontSize={fontSizes.small}
        >
          {!counterValue ? (
            "-"
          ) : (
            <CurrencyUnitValue
              unit={counterValueCurrency.units[0]}
              value={counterValue || 0}
              disableRounding={!!subMagnitude}
              subMagnitude={subMagnitude}
              showCode
            />
          )}
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
