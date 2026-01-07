import React, { memo } from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { NewIconType } from "@ledgerhq/native-ui/lib/components/Icon/type";
import { rgba } from "~/colors";

type Props = {
  onPress: () => void;
  title: string;
  Icon: NewIconType;
  subtitle: string;
  testID?: string;
};

export const OptionButton = memo(({ onPress, title, Icon, subtitle, testID }: Props) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 0 }}>
      <View
        style={[
          styles.wrapper,
          {
            borderRadius: 10,
            overflow: "hidden",
            height: 72,
            justifyContent: "center",
          },
        ]}
      >
        <View
          style={[
            styles.wrapper,
            {
              paddingStart: 10,
              paddingTop: 7,
            },
          ]}
        >
          <View
            style={[
              styles.icon,
              {
                backgroundColor: rgba(colors.black, 0.05),
                borderColor: rgba(colors.black, 0.1),
              },
            ]}
          >
            <Icon size={"M"} color={colors.black} />
          </View>
          <View style={styles.content} testID={testID}>
            <View style={styles.header}>
              <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Text style={{ color: colors.smoke }} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  content: {
    marginHorizontal: 16,
    flexGrow: 1,
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
  },
  icon: {
    borderWidth: 1,
    borderStyle: "solid",
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
