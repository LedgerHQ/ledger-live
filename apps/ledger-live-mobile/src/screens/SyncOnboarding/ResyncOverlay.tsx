import React, { useEffect, useRef, useState } from "react";
import { Flex, Icons, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "../../analytics";

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

  const { radii, colors } = useTheme();

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
      zIndex={1000}
      position="absolute"
      top={0}
      left={0}
      height="100%"
      width="100%"
      background={colors.constant.overlay}
    >
      <TrackScreen
        category="Stax BT Pairing Lost"
        type="toast"
        refreshSource={false}
      />
      <Flex position="absolute" width="100%" bottom={0} padding={4}>
        <Flex
          width="100%"
          backgroundColor="neutral.c100"
          borderRadius={radii[2]}
          p={6}
          flexDirection="row"
          alignItems="center"
          rowGap={4}
        >
          <Flex mr={4}>
            <Icons.WarningSolidMedium color="warning.c80" size={20} />
          </Flex>
          <Text
            variant="body"
            flex={1}
            textBreakStrategy="balanced"
            color="neutral.c00"
          >
            {t("syncOnboarding.resyncOverlay.content", { productName })}
          </Text>
          <InfiniteLoader color="neutral.c00" size={24} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ResyncOverlay;
