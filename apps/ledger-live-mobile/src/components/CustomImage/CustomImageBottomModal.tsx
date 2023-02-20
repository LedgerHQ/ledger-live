import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "../../const";
import QueuedDrawer, { Props as BottomModalProps } from "../QueuedDrawer";
import ModalChoice from "./ModalChoice";
import { importImageFromPhoneGallery } from "./imageUtils";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { TrackScreen } from "../../analytics";

const analyticsDrawerName = "Choose an image to set as your Stax lockscreen";

const analyticsButtonChoosePhoneGalleryEventProps = {
  button: "Choose from my picture gallery",
  drawer: analyticsDrawerName,
};

const analyticsButtonChooseNFTGalleryEventProps = {
  button: "Choose from NFT gallery",
  drawer: analyticsDrawerName,
};

type Props = {
  isOpened?: boolean;
  onClose: BottomModalProps["onClose"];
  device: Device | null;
};

const CustomImageBottomModal: React.FC<Props> = props => {
  const [isLoading, setIsLoading] = useState(false);
  const { isOpened, onClose, device } = props;
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const handleUploadFromPhone = useCallback(async () => {
    try {
      setIsLoading(true);
      const importResult = await importImageFromPhoneGallery();
      if (importResult !== null) {
        navigation.navigate(NavigatorName.CustomImage, {
          screen: ScreenName.CustomImagePreviewPreEdit,
          params: {
            ...importResult,
            isPictureFromGallery: true,
            device,
          },
        });
      }
    } catch (error) {
      console.error(error);
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImageErrorScreen,
        params: { error: error as Error, device },
      });
    }
    setIsLoading(false);
    onClose && onClose();
  }, [navigation, onClose, setIsLoading, device]);

  const handleSelectFromNFTGallery = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageNFTGallery,
      params: { device },
    });
    onClose && onClose();
  }, [navigation, device, onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={!!isOpened} onClose={onClose}>
      <TrackScreen
        category={analyticsDrawerName}
        type="drawer"
        refreshSource={false}
      />
      {isLoading ? (
        <Flex m={10}>
          <InfiniteLoader />
        </Flex>
      ) : (
        <>
          <ModalChoice
            onPress={handleUploadFromPhone}
            title={t("customImage.drawer.options.uploadFromPhone")}
            iconName={"Upload"}
            event="button_clicked"
            eventProperties={analyticsButtonChoosePhoneGalleryEventProps}
          />
          <Flex mt={6} />
          <ModalChoice
            onPress={handleSelectFromNFTGallery}
            title={t("customImage.drawer.options.selectFromNFTGallery")}
            iconName={"Ticket"}
            event="button_clicked"
            eventProperties={analyticsButtonChooseNFTGalleryEventProps}
          />
        </>
      )}
    </QueuedDrawer>
  );
};

export default CustomImageBottomModal;
