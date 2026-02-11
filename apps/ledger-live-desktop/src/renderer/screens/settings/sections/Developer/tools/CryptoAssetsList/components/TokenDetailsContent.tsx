import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TokenDetails, DetailRow } from "../styles";

interface TokenDetailsContentProps {
  token: TokenCurrency;
  t: (key: string) => string;
}

export const TokenDetailsContent: React.FC<TokenDetailsContentProps> = ({ token, t }) => (
  <TokenDetails>
    <DetailRow>
      <Text variant="small" fontWeight="semiBold" color="neutral.c100">
        ID
      </Text>
      <Text
        variant="small"
        color="neutral.c70"
        fontFamily="monospace"
        style={{ wordBreak: "break-all" }}
      >
        {token.id}
      </Text>
    </DetailRow>

    {token.contractAddress && (
      <DetailRow>
        <Text variant="small" fontWeight="semiBold" color="neutral.c100">
          {t("settings.developer.cryptoAssetsList.drawer.contractAddress")}
        </Text>
        <Text
          variant="small"
          color="neutral.c70"
          fontFamily="monospace"
          style={{ wordBreak: "break-all" }}
        >
          {token.contractAddress}
        </Text>
      </DetailRow>
    )}

    {token.tokenType && (
      <DetailRow>
        <Text variant="small" fontWeight="semiBold" color="neutral.c100">
          {t("settings.developer.cryptoAssetsList.drawer.tokenType")}
        </Text>
        <Text variant="small" color="neutral.c70">
          {token.tokenType}
        </Text>
      </DetailRow>
    )}

    {token.parentCurrency && (
      <DetailRow>
        <Text variant="small" fontWeight="semiBold" color="neutral.c100">
          {t("settings.developer.cryptoAssetsList.drawer.parentCurrency")}
        </Text>
        <Text variant="small" color="neutral.c70">
          {token.parentCurrency.name} ({token.parentCurrency.ticker})
        </Text>
      </DetailRow>
    )}

    {token.ledgerSignature && (
      <DetailRow>
        <Text variant="small" fontWeight="semiBold" color="neutral.c100">
          {t("settings.developer.cryptoAssetsList.drawer.ledgerSignature")}
        </Text>
        <Text
          variant="small"
          color="neutral.c70"
          fontFamily="monospace"
          style={{ wordBreak: "break-all" }}
        >
          {token.ledgerSignature}
        </Text>
      </DetailRow>
    )}

    {token.units && token.units.length > 0 && (
      <DetailRow>
        <Text variant="small" fontWeight="semiBold" color="neutral.c100">
          {t("settings.developer.cryptoAssetsList.drawer.units")}
        </Text>
        <Flex flexDirection="column" rowGap={1} mt={1}>
          {token.units.map(unit => (
            <Flex key={unit.code} flexDirection="column" pl={2}>
              <Text variant="tiny" color="neutral.c70">
                • {unit.name} ({unit.code}): magnitude {unit.magnitude}
              </Text>
            </Flex>
          ))}
        </Flex>
      </DetailRow>
    )}

    <DetailRow>
      <Text variant="small" fontWeight="semiBold" color="neutral.c100">
        {t("settings.developer.cryptoAssetsList.drawer.delisted")}
      </Text>
      <Text variant="small" color="neutral.c70">
        {token.delisted ? "Yes" : "No"}
      </Text>
    </DetailRow>
  </TokenDetails>
);
