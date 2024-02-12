import { IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Share, StyleSheet } from "react-native";
import Touchable from "./Touchable";

const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});

type Props = {
  children: React.ReactNode;
  value: string;
};

export const ShareLink = ({ children, value }: Props) => {
  const onPress = async () => {
    await Share.share({
      message: value,
    });
  };

  return (
    <Touchable event="ShareLink" style={styles.linkContainer} onPress={onPress}>
      <IconsLegacy.ShareMedium size={16} color="primary.c80" />
      <Text variant="body" fontWeight="semiBold" color="primary.c80" ml={3}>
        {children}
      </Text>
    </Touchable>
  );
};

export default ShareLink;
