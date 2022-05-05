import React, { memo } from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { useRoute, useTheme } from "@react-navigation/native";
import { scrollToTop } from "../../../navigation/utils";
import LText from "../../../components/LText";

const NftGalleryHeaderTitle = () => {
  const { params } = useRoute();
  const { colors } = useTheme();

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <LText semiBold secondary numberOfLines={1} style={styles.title}>
          {params.title}
        </LText>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    paddingRight: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 32,
    paddingVertical: 5,
  },
});

export default memo(NftGalleryHeaderTitle);
