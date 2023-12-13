import React, { useCallback, useMemo, memo } from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, Platform, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { AppBranch, LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { translateContent } from "@ledgerhq/live-common/platform/logic";
import { useLocale } from "~/context/Locale";
import LText from "~/components/LText";
import IconChevron from "~/icons/ArrowRight";
import AppIcon from "../AppIcon";
import { Theme } from "../../../colors";

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

const AppCard = ({ manifest, onPress }: Props) => {
  const { colors } = useTheme();
  const { locale } = useLocale();
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
  const description = useMemo(
    () => translateContent(manifest.content.shortDescription, locale),
    [locale, manifest.content.shortDescription],
  );
  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: colors.card,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <AppIcon isDisabled={isDisabled} size={48} name={manifest.name} icon={manifest.icon} />
        <View style={styles.content}>
          <View style={styles.header}>
            <LText
              variant="h3"
              style={[
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
            numberOfLines={2}
          >
            {description}
          </LText>
        </View>
        {!isDisabled && <IconChevron size={18} color={colors.smoke} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      },
    }),
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
  },
  title: {
    flexGrow: 0,
    flexShrink: 1,
    overflow: "hidden",
  },
  description: {
    fontSize: 14,
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
export default memo<Props>(AppCard);
