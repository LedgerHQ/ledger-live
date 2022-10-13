import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import BottomModal, { Props as BottomModalProps } from "../BottomModal";
import ModalChoice from "./ModalChoice";
import { importImageFromPhoneGallery } from "./imageUtils";

type Props = {
  isOpened?: boolean;
  onClose: BottomModalProps["onClose"];
};

const CustomImageBottomModal: React.FC<Props> = props => {
  const [isLoading, setIsLoading] = useState(false);
  const { onClose } = props;
  const { t } = useTranslation();
  const navigation = useNavigation();
  const handleUploadFromPhone = useCallback(async () => {
    try {
      setIsLoading(true);
      const importResult = await importImageFromPhoneGallery();
      if (importResult !== null) {
        navigation.navigate(NavigatorName.CustomImage, {
          screen: ScreenName.CustomImageStep1Crop,
          params: { ...importResult, isPictureFromGallery: true },
        });
      }
    } catch (error) {
      console.error(error);
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImageErrorScreen,
        params: { error },
      });
    }
    setIsLoading(false);
    onClose && onClose();
  }, [navigation, onClose, setIsLoading]);

  return (
    <BottomModal isOpened={props.isOpened} onClose={props.onClose}>
      <Text variant="h4" fontWeight="semiBold" pb={5}>
        {t("customImage.drawer.title")}
      </Text>
      {isLoading ? (
        <Flex m={10}>
          <InfiniteLoader />
        </Flex>
      ) : (
        <>
          <ModalChoice
            onPress={handleUploadFromPhone}
            title={t("customImage.drawer.options.uploadFromPhone")}
            iconName={"ArrowFromBottom"}
            event=""
          />
        </>
      )}
    </BottomModal>
  );
};

export default CustomImageBottomModal;
