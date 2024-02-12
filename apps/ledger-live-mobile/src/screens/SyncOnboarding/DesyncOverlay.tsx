import React, { useEffect, useRef, useState } from "react";
import { Flex, IconsLegacy, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";

type DelayProps = {
  isOpen: boolean;
  /**
   * Delay in ms before displaying the overlay
   */
  delay?: number;
};

type Props = DelayProps & {
  productName: string;
};

const Container = styled(Flex).attrs({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "constant.overlay",
  zIndex: 100,
})``;

const DisplayWithDelay: React.FC<DelayProps & { children?: React.ReactNode | null }> = ({
  children,
  isOpen,
  delay = 0,
}) => {
  const [showContent, setShowContent] = useState<boolean>(false);
  const showContentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return <>{children}</>;
};

export const PlainOverlay = ({ isOpen, delay }: DelayProps) => (
  <DisplayWithDelay isOpen={isOpen} delay={delay}>
    <Container />
  </DisplayWithDelay>
);

/**
 * Overlay displayed during the sync onboarding when the polling does not return the current device state
 * because an "allowed" error occurred.
 *
 * This overlay informs to the user that the sync onboarding is still trying to re-connect/synchronize with the device.
 */
const DesyncOverlay: React.FC<Props> = ({ isOpen, delay = 0, productName }) => {
  const { t } = useTranslation();

  const { radii } = useTheme();

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <DisplayWithDelay isOpen={isOpen} delay={delay}>
      <Container>
        <TrackScreen category="Stax BT Pairing Lost" type="toast" refreshSource={false} />
        <Flex position="absolute" width="100%" bottom={safeAreaInsets.bottom} padding={4}>
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
              <IconsLegacy.WarningSolidMedium color="warning.c40" size={20} />
            </Flex>
            <Text variant="body" flex={1} textBreakStrategy="balanced" color="neutral.c00">
              {t("syncOnboarding.resyncOverlay.content", { productName })}
            </Text>
            <InfiniteLoader color="neutral.c00" size={24} />
          </Flex>
        </Flex>
      </Container>
    </DisplayWithDelay>
  );
};

export default DesyncOverlay;
