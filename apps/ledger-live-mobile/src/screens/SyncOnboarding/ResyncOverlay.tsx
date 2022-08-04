import React, { useEffect, useState } from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  delay?: number;
};

const ResyncOverlay = ({ isOpen, delay = 0 }: Props) => {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState<boolean>(false);
  const { colors, radii } = useTheme();

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
    <Flex
      zIndex={100}
      position="absolute"
      background={colors.constant.overlay}
      top={0}
      left={0}
      height="100%"
      width="100%"
    >
      <Flex position="absolute" width="100%" bottom={0} padding={4}>
        <Flex
          width="100%"
          background={colors.warning.c100}
          borderRadius={radii[2]}
          p={6}
          flexDirection="row"
          justifyContent="space-between"
        >
          <Text pr={3} variant="body" textBreakStrategy="balanced">
            {t("syncOnboarding.resyncOverlay.content")}
          </Text>
          <InfiniteLoader color="black" size={24} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ResyncOverlay;
