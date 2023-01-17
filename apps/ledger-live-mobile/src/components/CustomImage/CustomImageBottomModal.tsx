import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "../../const";
import BottomModal, { Props as BottomModalProps } from "../BottomModal";
import ModalChoice from "./ModalChoice";
import { importImageFromPhoneGallery } from "./imageUtils";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";

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
    <BottomModal isOpened={isOpened} onClose={onClose}>
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
            event=""
          />
          <Flex mt={6} />
          <ModalChoice
            onPress={handleSelectFromNFTGallery}
            title={t("customImage.drawer.options.selectFromNFTGallery")}
            iconName={"Ticket"}
            event=""
          />
        </>
      )}
    </BottomModal>
  );
};

export default CustomImageBottomModal;
