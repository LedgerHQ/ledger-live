import React, { useEffect, useRef, useState } from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

type Props = {
  isOpen: boolean;
  productName: string;
  delay?: number;
};

const ResyncOverlay = ({ isOpen, delay = 0, productName }: Props) => {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState<boolean>(false);
  const showContentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { radii } = useTheme();

  useEffect(() => {
    if (isOpen) {
      showContentTimerRef.current = setTimeout(() => {
        setShowContent(true);
      }, delay);
    }

    return () => {
      if (showContentTimerRef.current) {
        clearTimeout(showContentTimerRef.current);
        showContentTimerRef.current = null;
      }
    };
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
      backgroundColor="constant.overlay"
      top={0}
      left={0}
      height="100%"
      width="100%"
    >
      <Flex position="absolute" width="100%" bottom={0} padding={4}>
        <Flex
          width="100%"
          backgroundColor="warning.c100"
          borderRadius={radii[2]}
          p={6}
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="space-between"
        >
          <Text variant="body" textBreakStrategy="balanced" flexBasis="90%">
            {t("syncOnboarding.resyncOverlay.content", { productName })}
          </Text>
          <Flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            flexBasis="10%"
          >
            <InfiniteLoader color="black" size={24} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ResyncOverlay;
