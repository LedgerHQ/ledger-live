import React from "react";
import { Flex, IconsLegacy, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { Container } from "./styles";
import { useDisplayWithDelay } from "./useDisplayWithDelay";
import { useDesyncOverlayViewModel } from "./useDesyncOverlayViewModel";
import type { DelayProps, DesyncOverlayProps, DesyncOverlayViewProps } from "./types";

const View = ({
  shouldDisplay,
  productName,
  borderRadius,
  bottomInset,
}: DesyncOverlayViewProps) => {
  const { t } = useTranslation();

  if (!shouldDisplay) {
    return null;
  }

  return (
    <Container>
      <TrackScreen category="Stax BT Pairing Lost" type="toast" refreshSource={false} />
      <Flex position="absolute" width="100%" bottom={bottomInset} padding={4}>
        <Flex
          width="100%"
          backgroundColor="neutral.c100"
          borderRadius={borderRadius}
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
  );
};

export const PlainOverlay = ({ isOpen, delay }: DelayProps) => {
  const shouldDisplay = useDisplayWithDelay({ isOpen, delay });

  return shouldDisplay ? <Container /> : null;
};

/**
 * Overlay displayed during the sync onboarding when the polling does not return the current device state
 * because an "allowed" error occurred.
 *
 * This overlay informs to the user that the sync onboarding is still trying to re-connect/synchronize with the device.
 */
const DesyncOverlay: React.FC<DesyncOverlayProps> = props => (
  <View {...useDesyncOverlayViewModel(props)} />
);

export default DesyncOverlay;
