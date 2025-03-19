import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import styled from "styled-components";
import { Collapsible } from "../../components/Collapsible";
import { SupportedChainsViewModelResult } from "./useSupportedChainsViewModel";

export function SupportedChains(props: SupportedChainsViewModelResult) {
  const { currencies, notSupported, visible, total, isIncluded, handleChange } = props;
  return (
    <Collapsible
      title={"settings.developer.debugNfts.configuration.supported"}
      body={
        <Flex flexDirection="row" columnGap={2}>
          <Container flexDirection="column" alignItems="flex-start">
            {currencies.map(currency => (
              <Flex
                key={currency.name}
                alignItems="center"
                justifyContent="center"
                data-testid={`supported-currency-${currency.id}`}
              >
                <CryptoCurrencyIcon currency={currency} size={12} />
                <Text ml={2} color={currency.color}>
                  {currency.name}
                </Text>
              </Flex>
            ))}
          </Container>

          <Container flexDirection="column" alignItems="flex-start">
            {notSupported.map(currency => {
              const included = isIncluded(currency);
              return (
                <Flex
                  key={currency.name}
                  alignItems="center"
                  justifyContent="center"
                  data-testid={`not-supported-currency-${currency.id}`}
                >
                  {included ? (
                    <CryptoCurrencyIcon currency={currency} size={12} />
                  ) : (
                    <Box height={14} />
                  )}

                  <Text ml={2} color={included ? currency.color : "opacityDefault.c20"}>
                    {currency.name}
                  </Text>
                  <InteractIcon
                    ml={2}
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => handleChange(currency, included)}
                    data-testid={`interact-icon-${currency.id}`}
                  >
                    {included ? <Icons.Eye size="XS" /> : <Icons.EyeCross size="XS" />}
                  </InteractIcon>
                </Flex>
              );
            })}
          </Container>
        </Flex>
      }
      visible={visible}
      badge={total}
    />
  );
}

const Container = styled(Flex)`
  border-radius: 8px;
  padding: 10px 20px;
`;

const InteractIcon = styled(Flex)`
  &:hover {
    cursor: pointer;
    > * {
      color: ${p => p.theme.colors.primary.c80};
    }
  }
`;
