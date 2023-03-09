import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { LedgerLogoRegular } from "@ledgerhq/native-ui/assets/icons";
import { Trans, useTranslation } from "react-i18next";
import QueuedDrawer from "../QueuedDrawer";

export type DesignedForStaxTextProps = {
  size?: "small" | "medium" | "large";
  hideBackground?: boolean;
};

export const DesignedForStaxText = ({
  size = "small",
  hideBackground = false,
}: DesignedForStaxTextProps) => {
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
          size={size === "medium" ? 24 : size === "large" ? 36 : 16}
          color="neutral.c100"
        />
      </Flex>
    );
  };

  const TagText = ({ children }: { children?: string }) => (
    <Text
      px={size === "small" ? 1 : 2}
      variant="tinyAlpha"
      fontSize={size === "medium" ? 14 : size === "large" ? 20 : undefined}
      textTransform="uppercase"
      textAlign="center"
    >
      {children}
    </Text>
  );

  return (
    <Flex
      p={size === "small" ? 3 : 5}
      bg={hideBackground ? undefined : "effects.dropShadow"}
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
      <Trans i18nKey="nft.designedForStax.title">
        <TagText />
        <LedgerLogo />
        <TagText />
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
