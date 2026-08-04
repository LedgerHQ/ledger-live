import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Flex, Text } from "@ledgerhq/react-ui";
import ExitIcon from "~/renderer/icons/ExitIcon";
import { track } from "~/renderer/analytics/segment";
import styled, { useTheme } from "styled-components";

export type Props = {
  onClose: () => void;
  displayTitle: boolean | null;
  companionStep: "first-step" | "second-step";
};

const AnimatedText = styled.div<{ visible?: boolean | null }>`
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.6s linear;
`;

const Header = ({ onClose, displayTitle, companionStep }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const title = companionStep === "first-step" ? "titleTwoStep" : "secureCryptoTitle";
  const backgroundColor = colors.background.default;

  return (
    <Flex
      width="100vw"
      justifyContent="space-between"
      position="sticky"
      bg={backgroundColor}
      top={0}
      left={0}
      zIndex={8}
      style={{
        boxShadow: displayTitle ? `0px 5px 15px 5px ${backgroundColor}` : "none",
        transition: "box-shadow .6s linear",
      }}
    >
      <Flex my={10} ml={120}>
        <AnimatedText visible={displayTitle}>
          <Text variant="h3Inter" fontSize="8" fontWeight="semiBold">
            {t(`syncOnboarding.manual.${title}`)}
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
