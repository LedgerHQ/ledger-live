import { Flex, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import LText from "../LText";

export const AddNewItem = ({ style }: { style?: any }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        style,
        styles.card,
        {
          backgroundColor: colors.background.main,
          borderColor: colors.neutral.c60,
        },
      ]}
    >
      <RectButton onPress={() => console.log("Add new NFT")}>
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Icons.PlusMedium size={24} color={colors.neutral.c100} />
          <LText
            semiBold
            color={colors.neutral.c100}
            style={styles.text}
            mt={2}
          >
            {t("nft.gallery.addNew")}
          </LText>
        </Flex>
      </RectButton>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 4,
    width: 160,
    height: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
  },
});
