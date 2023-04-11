import React, { useCallback, useMemo, memo } from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  AppBranch,
  LiveAppManifest,
} from "@ledgerhq/live-common/platform/types";
import LText from "../../../../components/LText";
import { AppIcon } from "../AppIcon";
import { Theme } from "../../../../colors";

function getBranchStyle(branch: AppBranch, colors: Theme["colors"]) {
  switch (branch) {
    case "soon":
      return {
        color: colors.grey,
        badgeColor: colors.grey,
        borderColor: colors.lightFog,
        backgroundColor: colors.lightFog,
      };

    case "experimental":
      return {
        color: colors.darkBlue,
        badgeColor: colors.orange,
        borderColor: colors.orange,
        backgroundColor: "transparent",
      };

    case "debug":
      return {
        color: colors.darkBlue,
        badgeColor: colors.grey,
        borderColor: colors.grey,
        backgroundColor: "transparent",
      };

    default:
      return {
        color: colors.darkBlue,
        badgeColor: colors.live,
        borderColor: colors.live,
        backgroundColor: "transparent",
      };
  }
}

type Props = {
  manifest: LiveAppManifest;
  onPress: (_: LiveAppManifest) => void;
};

export const AppCard = memo(({ manifest, onPress }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isDisabled = manifest.branch === "soon";
  const handlePress = useCallback(
    () => (!isDisabled && onPress ? onPress(manifest) : null),
    [onPress, manifest, isDisabled],
  );
  const { color, badgeColor, borderColor, backgroundColor } = useMemo(
    () => getBranchStyle(manifest.branch, colors),
    [colors, manifest.branch],
  );

  const url = useMemo(() => manifest.homepageUrl, [manifest.homepageUrl]);
  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <View style={[styles.wrapper]}>
        <AppIcon
          isDisabled={isDisabled}
          size={52}
          name={manifest.name}
          icon={manifest.icon}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <LText
              variant="h3"
              style={[
                styles.title,
                {
                  color,
                },
              ]}
              numberOfLines={1}
              semiBold
            >
              {manifest.name}
            </LText>
            {manifest.branch !== "stable" && (
              <LText
                style={[
                  styles.branch,
                  {
                    color: badgeColor,
                    borderColor,
                    backgroundColor,
                  },
                ]}
                semiBold
              >
                {t(`platform.catalog.branch.${manifest.branch}`, {
                  defaultValue: manifest.branch,
                })}
              </LText>
            )}
          </View>
          <LText
            style={[
              styles.description,
              {
                color: colors.smoke,
              },
            ]}
            numberOfLines={1}
          >
            {url}
          </LText>
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
    marginBottom: 28,
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
  title: {
    flexShrink: 1,
  },
  description: {
    fontSize: 13,
  },
  branch: {
    fontSize: 9,
    width: "auto",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 3,
    borderStyle: "solid",
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    overflow: "hidden",
    textTransform: "uppercase",
  },
});
