import React from "react";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import QueuedDrawer from "../QueuedDrawer";

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
  return (
    <Flex px={size === "small" ? 1 : 2}>
      <Icons.LedgerLogoMedium
        size={size === "medium" ? 24 : size === "large" ? 36 : 16}
        color={hideBackground ? "neutral.c100" : "constant.white"}
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
    px={size === "small" ? 1 : 2}
    variant="tinyAlpha"
    fontSize={size === "medium" ? 14 : size === "large" ? 20 : undefined}
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
  return (
    <Flex
      p={size === "small" ? 3 : 5}
      bg={hideBackground ? undefined : "#00000032"}
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
      <Trans i18nKey="nft.designedForStax.title">
        <TagText size={size} hideBackground={hideBackground} />
        <LedgerLogo size={size} hideBackground={hideBackground} />
        <TagText size={size} hideBackground={hideBackground} />
      </Trans>
    </Flex>
  );
};

export type DesignedForStaxDrawerProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export const DesignedForStaxDrawer = ({
  isOpen,
  onClose,
}: DesignedForStaxDrawerProps) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer noCloseButton isRequestingToBeOpened={isOpen}>
      <DesignedForStaxText size="large" hideBackground={true} />
      <Text
        variant="bodyLineHeight"
        color="neutral.c80"
        textAlign="center"
        my={4}
        mx={6}
      >
        {t("nft.designedForStax.drawer.description")}
      </Text>
      <Button mt={8} type="main" onPress={onClose}>
        {t("nft.designedForStax.drawer.cta")}
      </Button>
    </QueuedDrawer>
  );
};
