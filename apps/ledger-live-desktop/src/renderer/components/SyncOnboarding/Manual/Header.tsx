import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Flex, Text } from "@ledgerhq/react-ui";
import ExitIcon from "~/renderer/icons/ExitIcon";
import { track } from "~/renderer/analytics/segment";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import styled, { useTheme } from "styled-components";

export type Props = {
  onClose: () => void;
  device: Device | null;
  displayTitle: boolean | null;
};

const AnimatedText = styled.div<{ visible?: boolean | null }>`
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.6s linear;
`;

const Header = ({ onClose, device, displayTitle }: Props) => {
  const { t } = useTranslation();
  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;
  const { colors } = useTheme();

  const palette = colors.palette.type;

  return (
    <Flex
      width="100vw"
      justifyContent="space-between"
      position="sticky"
      bg={palette === "dark" ? "#131415" : "#F9F9F9"} //using the hex colors that can be found in light.js and dark.js local palettes, unaccessible here as we're in v3 context, until they're replaced by the design system colors in the whole app
      top={0}
      left={0}
      zIndex={8}
      style={{
        boxShadow: displayTitle
          ? `0px 5px 15px 5px ${
              palette === "dark" ? "#131415" : "#F9F9F9" //same as above
            }`
          : "none",
        transition: "box-shadow .6s linear",
      }}
    >
      <Flex my={10} ml={120}>
        <AnimatedText visible={displayTitle}>
          <Text variant="h3Inter" fontSize="8" fontWeight="semiBold">
            {t("syncOnboarding.manual.title", { deviceName })}
          </Text>
        </AnimatedText>
      </Flex>
      <Link
        m={12}
        size="large"
        type="shade"
        Icon={ExitIcon}
        onClick={() => {
          track("button_clicked2", { button: "Exit setup" });
          onClose();
        }}
        iconPosition="left"
      >
        {t("syncOnboarding.exitCTA")}
      </Link>
    </Flex>
  );
};

export default Header;
