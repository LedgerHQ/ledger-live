import React from "react";
import { Flex, IconsLegacy, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

type Size = "small" | "medium" | "large";

export type DesignedForStaxTextProps = {
  size?: Size;
  hideBackground?: boolean;
};

const LedgerLogo = ({
  // children isn't used at all but it's easier to maintain translation files
  // if the logo can be manipulated as a "Ledger" string
  children: _,
  size,
  hideBackground,
}: {
  children?: string;
} & DesignedForStaxTextProps) => {
  const { colors } = useTheme();
  return (
    <Flex px={size === "small" ? 1 : 2}>
      <IconsLegacy.LedgerLogoMedium
        size={size === "medium" ? 24 : size === "large" ? 36 : 16}
        color={hideBackground ? colors.neutral.c100 : colors.constant.white}
      />
    </Flex>
  );
};

const TagText = ({
  children,
  size,
  hideBackground,
}: {
  children?: string;
} & DesignedForStaxTextProps) => (
  <Text
    px={size === "small" ? 0 : 1}
    variant="tiny"
    fontSize={size === "medium" ? 14 : size === "large" ? 20 : 12}
    textTransform="uppercase"
    textAlign="center"
    color={hideBackground ? "neutral.c100" : "constant.white"}
  >
    {children}
  </Text>
);

export const DesignedForStaxText = ({
  size = "small",
  hideBackground = false,
}: DesignedForStaxTextProps) => {
  const { colors } = useTheme();
  return (
    <Flex
      flex={1}
      p={size === "small" ? 3 : 5}
      bg={hideBackground ? undefined : rgba(colors.constant.black, 0.4)}
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
      <Trans i18nKey="NFT.designedForStax">
        <TagText size={size} hideBackground={hideBackground} />
        <LedgerLogo size={size} hideBackground={hideBackground} />
        <TagText size={size} hideBackground={hideBackground} />
      </Trans>
    </Flex>
  );
};
