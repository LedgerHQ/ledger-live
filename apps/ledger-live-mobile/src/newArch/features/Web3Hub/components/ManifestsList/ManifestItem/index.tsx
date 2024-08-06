import React, { useCallback, useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppBranch, AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import type { MainProps, SearchProps } from "LLM/features/Web3Hub/types";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";
import { Theme } from "~/colors";

export type NavigationProp = MainProps["navigation"] | SearchProps["navigation"];
type ItemStyle = { color: string; badgeColor: string; borderColor: string; backgroundColor: string }

function getItemStyle(key: AppBranch | "default", colors: Theme["colors"]) {
  const styles: { [key: string]: ItemStyle } = {
    soon: {
      color: colors.grey,
      badgeColor: colors.grey,
      borderColor: colors.lightFog,
      backgroundColor: colors.lightFog,
    },
    experimental:{
        color: colors.darkBlue,
        badgeColor: colors.orange,
        borderColor: colors.orange,
        backgroundColor: "transparent",
      }, 
    debug: {
      color: colors.darkBlue,
      badgeColor: colors.grey,
      borderColor: colors.grey,
      backgroundColor: "transparent",
    }, 
    default: {
        color: colors.darkBlue,
        badgeColor: colors.live,
        borderColor: colors.live,
        backgroundColor: "transparent",
      }}

    return styles[key] || styles.default;
}

export default function ManifestItem({
  manifest,
  onPress,
}: {
  manifest: AppManifest;
  onPress: (manifest: AppManifest) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isDisabled = manifest.branch === "soon";

  const handlePress = useCallback(() => {
    if (isDisabled) {
      return;
    }
    onPress(manifest);
  }, [isDisabled, onPress, manifest]);

  const { color, badgeColor, borderColor, backgroundColor } = useMemo(
    () => getItemStyle(manifest.branch, colors),
    [colors, manifest.branch],
  );

  const label = (text: string, style: Omit<ItemStyle, "color">) => 
{
    const {badgeColor, borderColor, backgroundColor } = style
    return <Text
      fontSize="9px"
      width="auto"
      paddingX={2}
      paddingY={1}
      borderWidth={1}
      borderRadius={3}
      borderStyle={"solid"}
      flexGrow={0}
      flexShrink={0}
      overflow={"hidden"}
      textTransform="uppercase"
      color={badgeColor}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      fontWeight="semiBold"
    >
      {text}
    </Text>
    }

  const url = useMemo(() => {
    return new URL(manifest.url).origin;
  }, [manifest.url]);

  const icon = useMemo(() => {
    // RN tries to load file locally if there is a space in front of the file url
    return manifest.icon?.trim();
  }, [manifest.icon]);

  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <Flex flexDirection="row" alignItems="center" height={72} paddingX={4} paddingY={2}>
        <AppIcon isDisabled={isDisabled} size={48} name={manifest.name} icon={icon} />
        <Flex marginX={16} height="100%" flexGrow={1} flexShrink={1} justifyContent={"center"}>
          <Flex flexDirection="row" alignItems={"center"}  mb={2}  columnGap={4}>
            <Text variant="large" color={color} numberOfLines={1} fontWeight="semiBold">
              {manifest.name}
            </Text>
            <Flex flexDirection="row" alignItems={"center"} columnGap={4}>
            {manifest.branch !== "stable" &&
              label(
                t(`platform.catalog.branch.${manifest.branch}`, {
                  defaultValue: manifest.branch,
                }),
                getItemStyle(manifest.branch, colors)
              )}
              {manifest.categories.includes("clear signing") &&
              label(
                "clear signing",
                getItemStyle("default", colors)
              )}
          </Flex>
          </Flex>
  
          <Text fontSize={13} color={colors.smoke} numberOfLines={1}>
            {url}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
