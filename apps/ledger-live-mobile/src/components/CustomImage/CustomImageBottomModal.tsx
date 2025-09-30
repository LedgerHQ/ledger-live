import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Icons, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import Button from "../Button";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import QueuedDrawer, { Props as BottomModalProps } from "../QueuedDrawer";
import { importImageFromPhoneGallery } from "./imageUtils";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { TrackScreen } from "~/analytics";
import { type CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import styled from "styled-components/native";

const analyticsDrawerName = "Choose an image to set as your device lockscreen";

const analyticsButtonChoosePhoneGalleryEventProps = {
  button: "Choose from my picture gallery",
  drawer: analyticsDrawerName,
};

type Props = {
  isOpened?: boolean;
  onClose: BottomModalProps["onClose"];
  setDeviceHasImage?: (hasImage: boolean) => void;
  deviceHasImage?: boolean;
  device: Device | null;
  deviceModelId: CLSSupportedDeviceModelId | null;
  referral?: string;
};

const Header = () => {
  const { t } = useTranslation();
  return (
    <Flex justifyContent="center" alignSelf="center" mt={8} mb={6}>
      <Text textAlign="center" variant="h3Inter" fontSize={24} fontWeight="semiBold">
        {t("customImage.drawer.title")}
      </Text>
    </Flex>
  );
};

const ButtonContainer = styled(Flex)`
  flex-direction: column;
  row-gap: ${p => p.theme.space[6]};
`;

const CustomImageBottomModal: React.FC<Props> = props => {
  const {
    isOpened,
    onClose,
    device,
    deviceHasImage,
    setDeviceHasImage,
    deviceModelId,
    referral = undefined,
  } = props;
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const handleUploadFromPhone = useCallback(async () => {
    setLoading(true);
    const result = await importImageFromPhoneGallery();
    if (result !== null) {
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImagePreviewPreEdit,
        params: {
          device,
          deviceModelId,
          referral: referral,
          ...result,
        },
      });
    }
    onClose && onClose();
    setLoading(false);
  }, [device, deviceModelId, navigation, onClose, referral]);

  const handleRemoveImage = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageRemoval,
      params: {
        device,
        referral: referral,
        setDeviceHasImage: setDeviceHasImage || (() => {}),
      },
    });
  }, [navigation, device, referral, setDeviceHasImage]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpened}
      onClose={onClose}
      CustomHeader={loading ? () => null : Header}
    >
      <TrackScreen category={analyticsDrawerName} type="drawer" refreshSource={false} />
      {loading ? (
        <Flex m={10}>
          <InfiniteLoader />
        </Flex>
      ) : (
        <ButtonContainer>
          <Button
            onPress={handleUploadFromPhone}
            type="main"
            iconPosition="left"
            size="large"
            Icon={() => <Icons.DoublePicture size="M" color="neutral.c00" />}
            event="button_clicked"
            eventProperties={analyticsButtonChoosePhoneGalleryEventProps}
          >
            {t("customImage.drawer.options.uploadFromPhone")}
          </Button>
          {deviceHasImage ? (
            <Button
              type="error"
              iconPosition="left"
              outline
              size="large"
              Icon={() => <Icons.Trash size="M" color="error.c60" />}
              onPress={handleRemoveImage}
            >
              {t("customImage.drawer.options.remove")}
            </Button>
          ) : null}
        </ButtonContainer>
      )}
    </QueuedDrawer>
  );
};

export default CustomImageBottomModal;
