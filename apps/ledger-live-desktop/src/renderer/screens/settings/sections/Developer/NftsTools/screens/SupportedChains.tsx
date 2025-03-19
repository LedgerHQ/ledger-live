import { getEnv } from "@ledgerhq/live-env";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import React from "react";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import styled from "styled-components";
import { Collapsible } from "../components/Collapsible";

export function SupportedChains() {
  const currencies = getEnv("NFT_CURRENCIES").map(getCryptoCurrencyById);
  const visible = currencies.length > 0;

  return (
    <Collapsible
      title={"settings.developer.debugNfts.configuration.supported"}
      body={
        <Container flexDirection="column" alignItems="flex-start">
          {currencies.map(currency => (
            <Flex key={currency.name} alignItems="center" justifyContent="center">
              <CryptoCurrencyIcon currency={currency} size={12} />
              <Text ml={2} color={currency.color}>
                {currency.name}
              </Text>
            </Flex>
          ))}
        </Container>
      }
      visible={visible}
      badge={currencies.length}
    />
  );
}

const Container = styled(Flex)`
  border-radius: 8px;
  padding: 10px 20px;
`;
