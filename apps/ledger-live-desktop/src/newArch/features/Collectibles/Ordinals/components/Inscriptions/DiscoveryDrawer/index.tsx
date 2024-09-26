import React from "react";
import DiscoveryDrawerHeader from "./Header";
import ProtectBox from "./ProtectBox";
import { Button, CryptoIcon, Flex, Text } from "@ledgerhq/react-ui";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { Direction } from "@ledgerhq/react-ui/components/layout/Drawer/index";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const DiscoveryDrawer = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation();
  const learnMoreUrl = urls.whatAreOrdinals;
  const onButtonClick = () => openURL(learnMoreUrl);

  return (
    <SideDrawer
      isOpen={isOpen}
      withPaddingTop={false}
      onRequestClose={onClose}
      direction={Direction.Left}
      forceDisableFocusTrap
    >
      <DiscoveryDrawerHeader />
      <Flex
        px={40}
        mx={33}
        height="100%"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Flex p={18} bg="rgba(247, 147, 26, 0.05)" borderRadius="100%">
          <CryptoIcon name="BTC" circleIcon size={36} />
        </Flex>
        <Text variant="h4Inter" textAlign="center" my={space[6]} fontSize="24px">
          {t("ordinals.inscriptions.discoveryDrawer.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          color="neutral.c70"
          fontSize="14px"
          textAlign="center"
          mb={space[8]}
        >
          {t("ordinals.inscriptions.discoveryDrawer.description")}
        </Text>
        <Button variant="main" mb={space[14]} onClick={onButtonClick}>
          <Text variant="bodyLineHeight" fontSize={16} color="neutral.c00" textAlign="center">
            {t("ordinals.inscriptions.discoveryDrawer.learnMore")}
          </Text>
        </Button>
        <ProtectBox />
      </Flex>
    </SideDrawer>
  );
};

export default DiscoveryDrawer;
