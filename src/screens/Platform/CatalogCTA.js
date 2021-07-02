// @flow
import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";

import LText from "../../components/LText";
import IconExternalLink from "../../icons/ExternalLink";

type CatalogCTAType = "secondary" | "dashed";

type Props = {
  type?: CatalogCTAType,
  children: React$Node,
  title: React$Node,
  onPress: Function,
  Icon: React$ComponentType<*>,
  style?: *,
};

const CatalogCTA = ({
  type = "secondary",
  children: description,
  title,
  Icon,
  onPress,
  style,
}: Props) => {
  const { colors } = useTheme();
  const styles = getStyles(colors, type);

  return (
    <TouchableOpacity onPress={() => onPress()}>
      <View style={[styles.root, style]}>
        <View style={styles.content}>
          <View style={styles.head}>
            {Icon ? (
              <View style={styles.iconContainer}>
                <Icon size={18} color={styles.title.color} />
              </View>
            ) : null}
            <LText style={styles.title} semiBold>
              {title}
            </LText>
          </View>
          <LText style={styles.description}>{description}</LText>
        </View>
        <IconExternalLink size={18} color={colors.smoke} />
      </View>
    </TouchableOpacity>
  );
};

// @TODO rework this maybe flow is getting a bit crazy on that
const getStyles = (colors, type) =>
  StyleSheet.create({
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 4,
      marginBottom: 24,
      backgroundColor: type === "secondary" ? colors.lightFog : undefined,
      borderColor: type === "dashed" ? colors.fog : undefined,
      borderStyle: type === "dashed" ? "dashed" : undefined,
      borderWidth: type === "dashed" ? 1 : undefined,
    },
    content: {
      flex: 1,
      marginRight: 16,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    iconContainer: {
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      ...(type === "secondary"
        ? { color: colors.text }
        : type === "dashed"
        ? { color: colors.smoke }
        : { color: "#fff" }),
    },
    description: {
      fontSize: 14,
      ...(type === "secondary"
        ? { color: colors.smoke }
        : type === "dashed"
        ? { color: colors.text, fontWeight: "800" }
        : { color: "#fff" }),
    },
  });

export default CatalogCTA;
