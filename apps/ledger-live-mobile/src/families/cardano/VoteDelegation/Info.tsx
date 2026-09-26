import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Button from "~/components/Button";
import LText from "~/components/LText";

type Props = {
  title?: string;
  description: string;
  image?: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  ctaTitle: string;
};

export default function VoteDelegationInfo({
  title,
  description,
  image,
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
});
