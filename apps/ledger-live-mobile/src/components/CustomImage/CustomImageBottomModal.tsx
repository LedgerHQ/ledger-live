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

const testUrls = {
  boredApe: "https://img.phonandroid.com/2022/04/bored-ape-yacht-club.jpg",
  chessboard:
    "https://media.istockphoto.com/vectors/checkered-pattern-black-and-white-vector-id806894546?k=20&m=806894546&s=612x612&w=0&h=ci54bNwp8kTWiyNqtUKgqMkOau_Hl875T66oiEMbH64=",
  bigImage:
    "https://effigis.com/wp-content/uploads/2015/02/Airbus_Pleiades_50cm_8bit_RGB_Yogyakarta.jpg",
  hugeImage:
    "https://upload.wikimedia.org/wikipedia/commons/9/9d/Pieter_Bruegel_the_Elder_-_The_Fall_of_the_Rebel_Angels_-_Google_Art_Project.jpg",
  veryThinHugeImage:
    "https://cdn.theatlantic.com/assets/media/img/posts/NbYbNrs.png",
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
          params: importResult,
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

  const handleFromUrl = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep1Crop,
      params: {
        imageUrl: testUrls.veryThinHugeImage,
      },
    });
    onClose && onClose();
  }, [navigation, onClose]);

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
          <ModalChoice
            onPress={handleFromUrl}
            title={"(debug) from fixed URL"}
            iconName={"ArrowFromBottom"}
            event=""
          />
        </>
      )}
    </BottomModal>
  );
};

export default CustomImageBottomModal;
