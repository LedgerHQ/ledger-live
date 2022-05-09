import React, { memo } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { scrollToTop } from "../../../navigation/utils";

const NftGalleryHeaderTitle = () => {
  const { params } = useRoute();

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
        {params.title}
      </Text>
    </TouchableWithoutFeedback>
  );
};

export default memo(NftGalleryHeaderTitle);
