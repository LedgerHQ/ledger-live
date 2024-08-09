import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";
import CurrencyIconList from "./CurrencyIconList";

export default function ManifestRow({ manifest }: { manifest: AppManifest }) {
  const isDisabled = manifest.branch === "soon";

  return (
    <>
      <AppIcon isDisabled={isDisabled} size={48} name={manifest.name} icon={manifest.icon} />
      <Flex marginX={16} height="100%" flexGrow={1} flexShrink={1} justifyContent={"center"}>
        <Flex flexDirection="row" alignItems={"center"} mb={2}>
          <Text variant="large" numberOfLines={1} fontWeight="semiBold">
            {manifest.name}
          </Text>
        </Flex>
        <CurrencyIconList currencies={manifest.currencies} />
        {/* TODO add badges on certain categories */}
      </Flex>
    </>
  );
}
