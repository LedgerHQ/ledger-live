import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "styled-components/native";

const useStyles = () => {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        panel: {
          position: "absolute",
          bottom: 70,
          right: 10,
          left: 10,
          height: 400,
          backgroundColor: colors.neutral.c30,
          borderRadius: 8,
          padding: 20,
          zIndex: 998,
        },
        header: { color: colors.neutral.c100, fontWeight: "bold", marginBottom: 8, fontSize: 16 },
        input: {
          backgroundColor: colors.neutral.c40,
          color: colors.neutral.c100,
          padding: 6,
          borderRadius: 6,
          marginBottom: 10,
        },
        tabsRow: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 8,
        },
        tab: {
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 6,
          backgroundColor: colors.neutral.c20,
        },
        tabSelected: {
          backgroundColor: colors.neutral.c40,
          borderWidth: 1,
          borderColor: colors.neutral.c50,
        },
        tabLabel: { color: colors.neutral.c70 },
        tabLabelSelected: { color: colors.neutral.c100, fontWeight: "600" },
        section: { marginBottom: 10 },
        sectionHeader: { color: colors.neutral.c80, fontWeight: "600", marginBottom: 4 },
        sectionBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        },
        divider: {
          height: 1,
          backgroundColor: colors.neutral.c40,
          flex: 1,
        },
        subHeader: { color: colors.neutral.c80, marginTop: 6, marginBottom: 2, fontWeight: "500" },
        item: { marginBottom: 6, paddingLeft: 8 },
        key: { fontWeight: "600" },
        metaContainer: { paddingLeft: 6 },
        meta: { color: colors.neutral.c60, fontSize: 11 },
        args: { color: colors.neutral.c80, fontSize: 11 },
      }),
    [colors],
  );
};

export default useStyles;
