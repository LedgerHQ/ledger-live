import React from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TextInput from "~/components/TextInput";
import SettingsNavigationScrollView from "../../../SettingsNavigationScrollView";
import { ToggleRow } from "./components/ToggleRow";
import { useGenerateMockAccountsByTypeViewModel } from "./hooks/useGenerateMockAccountsByTypeViewModel";

export default function GenerateMockAccountsByType() {
  const {
    includeCryptos,
    includeStablecoins,
    includeTestnet,
    countInput,
    stablecoinsLoading,
    isValid,
    isReady,
    onToggleCryptos,
    setIncludeStablecoins,
    onToggleTestnet,
    setCountInput,
    onGenerate,
  } = useGenerateMockAccountsByTypeViewModel();

  const insets = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1 }} style={{ paddingBottom: insets.bottom }}>
      <SettingsNavigationScrollView>
        <ToggleRow
          label="Cryptos"
          description="Mainnet crypto accounts (random currencies)"
          value={includeCryptos}
          onValueChange={onToggleCryptos}
        />
        <ToggleRow
          label="Stablecoins"
          description="1 account per network (ETH · Tron · Algorand) with 10 stablecoin sub-accounts"
          value={includeStablecoins}
          onValueChange={setIncludeStablecoins}
        />
        <ToggleRow
          label="Testnets"
          description="Include testnet currencies in the crypto pool"
          value={includeTestnet}
          onValueChange={onToggleTestnet}
        />

        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16", paddingBottom: "s12" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
            Crypto accounts count
          </Text>
          <TextInput
            value={countInput}
            onChangeText={setCountInput}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="10"
          />

          {!isValid && (
            <Text typography="body2" lx={{ color: "error", marginTop: "s8" }}>
              Select at least one account type.
            </Text>
          )}

          {includeStablecoins && stablecoinsLoading && (
            <Box lx={{ flexDirection: "row", alignItems: "center", marginTop: "s8" }}>
              <Spinner size={16} />
              <Text typography="body2" lx={{ color: "muted", marginLeft: "s8" }}>
                Loading stablecoin data…
              </Text>
            </Box>
          )}
        </Box>
      </SettingsNavigationScrollView>

      <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: insets.bottom > 0 ? 0 : 24 }}>
        <Button appearance="base" isFull onPress={onGenerate} disabled={!isReady}>
          Generate accounts
        </Button>
      </Box>
    </Box>
  );
}
