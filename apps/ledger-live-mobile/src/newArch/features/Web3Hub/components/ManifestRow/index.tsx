import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";
import Label from "LLM/features/Web3Hub/components/ManifestsList/ManifestItem/Label";
import CurrencyIconList from "./CurrencyIconList";

export default function ManifestRow({ manifest }: { manifest: AppManifest }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isDisabled = manifest.branch === "soon";

  const clearSigningEnabled = useMemo(() => {
    return manifest?.categories.includes("clear signing");
  }, [manifest?.categories]);

  return (
    <>
      <AppIcon isDisabled={isDisabled} size={48} name={manifest.name} icon={manifest.icon} />
      <Flex ml={16} height="100%" flexGrow={1} flexShrink={1} justifyContent={"center"}>
        <Flex flexDirection="row" alignItems={"center"} mb={2}>
          <Text flex={1} variant="large" numberOfLines={1} fontWeight="semiBold">
            {manifest.name}
          </Text>

          {clearSigningEnabled && (
            <Label
              text={t(`web3hub.components.label.clearSigning`)}
              style={{
                borderWidth: 0,
                color: colors.black,
                backgroundColor: colors.lightGrey,
              }}
            />
          )}
          {/* TODO add badges on certain categories */}
        </Flex>
        <CurrencyIconList currencies={manifest.currencies} />
      </Flex>
    </>
  );
}
