import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader, Text, Box } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";

const Overlay = styled(Flex)`
  background: linear-gradient(rgba(0, 0, 0, 0) 0%, ${p => p.theme.colors.constant.overlay} 25%);
`;

type Props = {
  isOpen: boolean;
  delay?: number;
  productName: string;
};

export const DesyncOverlay = ({ isOpen, delay = 0, productName }: Props) => {
  const { t } = useTranslation();

  const [showContent, setShowContent] = useState<boolean>(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setShowContent(true);
      }, delay);
    }
  }, [isOpen, delay]);

  useEffect(() => {
    if (!isOpen) {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen || !showContent) {
    return null;
  }

  return (
    <Overlay
      zIndex={100}
      position="absolute"
      top={0}
      left={0}
      height="100%"
      width="100%"
      flexDirection="column"
    >
      <Flex alignItems="flex-end" justifyContent="center" flex={1} padding={4}>
        <Flex
          width="400px"
          backgroundColor={colors.warning}
          borderRadius="8px"
          p={4}
          mr={4}
          mb={4}
          flexDirection="row"
          alignItems="center"
        >
          <Box flexShrink={1}>
            <Text pr={3} variant="body" color={colors.constant.black}>
              {t("syncOnboarding.manual.desyncOverlay.errorMessage", {
                deviceName: productName,
              })}
            </Text>
          </Box>
          <InfiniteLoader color="black" size={24} />
        </Flex>
      </Flex>
    </Overlay>
  );
};
