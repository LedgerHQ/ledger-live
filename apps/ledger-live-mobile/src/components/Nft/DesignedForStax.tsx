import React from "react";
import { Flex, Text as BaseText } from "@ledgerhq/native-ui";
import { LedgerLogoRegular } from "@ledgerhq/native-ui/assets/icons";
import { Trans } from "react-i18next";

export type Props = {
  size?: "small" | "medium" | "large";
  hideBackground?: boolean;
};

const DesignedForStax = ({ size = "small", hideBackground = false }: Props) => {
  const LedgerLogo = ({
    // children isn't used at all but it's easier to maintain translation files
    // if the logo can be manipulated as a "Ledger" string
    children: _,
  }: {
    children?: string;
  }) => {
    return (
      <Flex px={size === "small" ? 1 : 2}>
        <LedgerLogoRegular
          size={size === "medium" ? 24 : size === "large" ? 32 : 16}
          color="neutral.c100"
        />
      </Flex>
    );
  };

  const Text = ({ children }: { children?: string }) => (
    <BaseText
      px={size === "small" ? 1 : 2}
      variant="tinyAlpha"
      fontSize={size === "medium" ? 14 : size === "large" ? 18 : undefined}
      textTransform="uppercase"
      textAlign="center"
    >
      {children}
    </BaseText>
  );

  return (
    <Flex
      p={size === "small" ? 3 : 5}
      bg={hideBackground ? undefined : "effects.dropShadow"}
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
      <Trans i18nKey="nft.designedForStax">
        <Text />
        <LedgerLogo />
        <Text />
      </Trans>
    </Flex>
  );
};

export default DesignedForStax;
