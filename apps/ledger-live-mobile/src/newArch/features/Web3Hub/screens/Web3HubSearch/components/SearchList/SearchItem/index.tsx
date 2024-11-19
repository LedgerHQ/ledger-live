import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import ManifestRow from "LLM/features/Web3Hub/components/ManifestRow";

type Props = {
  isFirst: boolean;
  manifest: AppManifest;
  onPress: (manifest: AppManifest) => void;
};

export default function SearchItem({ isFirst, manifest, onPress }: Props) {
  const { colors } = useTheme();
  const isDisabled = manifest.branch === "soon";

  const handlePress = useCallback(() => {
    if (isDisabled) {
      return;
    }
    onPress(manifest);
  }, [isDisabled, onPress, manifest]);

  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <Flex
        borderColor={colors.lightGrey}
        borderTopWidth={isFirst ? 0 : 1}
        flexDirection="row"
        alignItems="center"
        height={72}
        paddingX={4}
        paddingY={2}
      >
        <ManifestRow manifest={manifest} />
      </Flex>
    </TouchableOpacity>
  );
}
