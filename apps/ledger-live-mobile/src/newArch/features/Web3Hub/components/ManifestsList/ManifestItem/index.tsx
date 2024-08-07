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
    () => getBranchStyle(manifest.branch, colors),
    [colors, manifest.branch],
  );

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
          <Flex flexDirection="row" alignItems={"center"} mb={2}>
            <Text variant="large" color={color} numberOfLines={1} fontWeight="semiBold">
              {manifest.name}
            </Text>
            {manifest.branch !== "stable" && (
              <Text
                fontSize="9px"
                width="auto"
                paddingX={2}
                paddingY={1}
                borderWidth={1}
                borderRadius={3}
                borderStyle={"solid"}
                flexGrow={0}
                flexShrink={0}
                marginLeft={3}
                overflow={"hidden"}
                textTransform="uppercase"
                color={badgeColor}
                borderColor={borderColor}
                backgroundColor={backgroundColor}
                fontWeight="semiBold"
              >
                {t(`platform.catalog.branch.${manifest.branch}`, {
                  defaultValue: manifest.branch,
                })}
              </Text>
            )}
          </Flex>
          <Text fontSize={13} color={colors.smoke} numberOfLines={1}>
            {url}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
