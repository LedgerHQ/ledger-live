import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";
import ExternalLink from "~/icons/ExternalLink";
import Button from "./Button";
import LText from "./LText";

type Props = {
  title?: string;
  description: string;
  image?: React.ReactNode;
  infoUrl: string;
  infoTitle: string;
  disabled?: boolean;
  onPress: () => void;
  ctaTitle: string;
};
export default function AccountDelegationInfo({
  title,
  description,
  image,
  infoUrl,
  infoTitle,
  disabled,
  onPress,
  ctaTitle,
}: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.container}>
          {image}
          {title && (
            <LText semiBold style={styles.title}>
              {title}
            </LText>
          )}
          <LText style={styles.description} color="grey">
            {description}
          </LText>
          <TouchableOpacity
            style={styles.infoLinkContainer}
            onPress={() => Linking.openURL(infoUrl)}
          >
            <LText bold style={styles.infoLink} color="live">
              {infoTitle}
            </LText>
            <ExternalLink size={11} color={colors.live} />
          </TouchableOpacity>
        </View>
        <Button type="primary" disabled={disabled} onPress={onPress} title={ctaTitle} event="" />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "stretch",
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 17,
    paddingVertical: 8,
    textAlign: "center",
  },
  infoLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLink: {
    fontSize: 13,
    lineHeight: 22,
    paddingVertical: 8,
    textAlign: "center",
    marginRight: 6,
  },
});
