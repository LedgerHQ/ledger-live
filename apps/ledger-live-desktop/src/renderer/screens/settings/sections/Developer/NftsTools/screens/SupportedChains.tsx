import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useState } from "react";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import styled from "styled-components";
import { Collapsible } from "../components/Collapsible";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const NOT_SUPPORTED = ["solana", "base", "arbitrum", "optimism"];

export function SupportedChains() {
  const [overhiddenCurrencies, setOverhiddenCurrencies] = useState<string[]>([]);
  const currencies = getEnv("NFT_CURRENCIES").map(getCryptoCurrencyById);
  const notSupported = NOT_SUPPORTED.map(getCryptoCurrencyById);

  const visible = currencies.length > 0;

  const handleChange = useCallback(
    (currency: CryptoCurrency, included: boolean) => {
      const newTab = included
        ? overhiddenCurrencies.filter(c => c !== currency.id)
        : [...overhiddenCurrencies, currency.id];
      setOverhiddenCurrencies(newTab);

      const setUniques = new Set(getEnv("NFT_CURRENCIES").concat(newTab));

      setEnvUnsafe("NFT_CURRENCIES", [...setUniques].join(","));
    },
    [overhiddenCurrencies],
  );

  const initialCurrencies = currencies.filter(c => !notSupported.includes(c));
  const total = initialCurrencies.length + overhiddenCurrencies.length;

  return (
    <Collapsible
      title={"settings.developer.debugNfts.configuration.supported"}
      body={
        <Flex flexDirection="row" columnGap={2}>
          <Container flexDirection="column" alignItems="flex-start">
            {initialCurrencies.map(currency => (
              <Flex key={currency.name} alignItems="center" justifyContent="center">
                <CryptoCurrencyIcon currency={currency} size={12} />
                <Text ml={2} color={currency.color}>
                  {currency.name}
                </Text>
              </Flex>
            ))}
          </Container>

          <Container flexDirection="column" alignItems="flex-start">
            {notSupported.map(currency => {
              const included = overhiddenCurrencies.includes(currency.id);
              return (
                <Flex key={currency.name} alignItems="center" justifyContent="center">
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
