import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import ManifestRow from "LLM/features/Web3Hub/components/ManifestRow";

export default function SearchItem({
  manifest,
  onPress,
}: {
  manifest: AppManifest;
  onPress: (manifest: AppManifest) => void;
}) {
  const isDisabled = manifest.branch === "soon";

  const handlePress = useCallback(() => {
    if (isDisabled) {
      return;
    }
    onPress(manifest);
  }, [isDisabled, onPress, manifest]);

  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <Flex flexDirection="row" alignItems="center" height={72} paddingX={4} paddingY={2}>
        <ManifestRow manifest={manifest} />
      </Flex>
    </TouchableOpacity>
  );
}
