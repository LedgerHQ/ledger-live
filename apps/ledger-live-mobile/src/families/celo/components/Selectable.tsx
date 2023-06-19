import React, { memo } from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Text } from "@ledgerhq/native-ui";
import { rgba } from "../../../colors";

const Selectable = ({ name }: { name: string }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.validatorSelection, { backgroundColor: rgba(colors.primary, 0.2) }]}>
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color={colors.primary}
      >
        {name}
      </Text>

      <View style={[styles.validatorSelectionIcon, { backgroundColor: colors.primary }]}>
        <Icon size={16} name="edit-2" color={colors.text} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  validatorSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  validatorSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  validatorSelectionIcon: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 40,
  },
});

export default memo(Selectable);
