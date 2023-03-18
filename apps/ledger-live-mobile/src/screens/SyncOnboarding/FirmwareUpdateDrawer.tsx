import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { NanoFirmwareUpdateMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";

export type Props = {
  isOpen: boolean;
  onSkip?: () => void;
  onUpdate?: () => void;
  onClose?: () => void;
  productName: string;
};

const FirmwareUpdateDrawer = ({
  isOpen,
  onSkip,
  onUpdate,
  onClose,
  productName,
}: Props) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      onClose={() => {
        onClose?.();
        onSkip?.(); // TODO: skip logic shouldn't be called from there
      }}
      isRequestingToBeOpened={isOpen}
      preventBackdropClick
    >
      <TrackScreen
        category={`Set up ${productName}: Step 4: Software update available`}
        type={"drawer"}
      />
      <Flex justifyContent="center" alignItems="center">
        <BoxedIcon
          Icon={<NanoFirmwareUpdateMedium color="primary.c90" size={24} />}
          variant="circle"
          backgroundColor="primary.c30"
          borderColor="transparent"
          size={48}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t("syncOnboarding.softwareChecksSteps.updateAvailableDrawer.title")}
      </Text>
      <Text
        textAlign="center"
        variant="bodyLineHeight"
        mb={8}
        color="neutral.c80"
      >
        {t(
          "syncOnboarding.softwareChecksSteps.updateAvailableDrawer.description",
          { productName },
        )}
      </Text>
      <Button type="main" mb={6} onPress={onUpdate}>
        {t(
          "syncOnboarding.softwareChecksSteps.updateAvailableDrawer.updateCta",
        )}
      </Button>
    </QueuedDrawer>
  );
};

export default FirmwareUpdateDrawer;
