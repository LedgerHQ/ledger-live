import React, { useCallback, useState } from "react";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useModularDrawerController } from "../hooks/useModularDrawerController";
import FeatureFlagDetails from "~/screens/FeatureFlagsSettings/FeatureFlagDetails";
import { ScrollView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import { SectionCard, ToggleRow, PickerField, Divider } from "./components";
import {
  assetLeftOptions,
  assetRightOptions,
  networkLeftOptions,
  networkRightOptions,
} from "./const/configurationOptions";
import { AssetConfiguration, NetworkConfiguration } from "./types";
import {
  assetsLeftElementOptions,
  assetsRightElementOptions,
  networksLeftElementOptions,
  networksRightElementOptions,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { getElement, makeOnValueChange } from "./utils";

function ModularDrawerScreenDebug() {
  const { openDrawer } = useModularDrawerController();

  const [enableAccountSelection, setEnableAccountSelection] = useState(true);
  const [enableOnAccountSelected, setEnableOnAccountSelected] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAssetLeftElement, setSelectedAssetLeftElement] =
    useState<AssetConfiguration["leftElement"]>("undefined");
  const [selectedAssetRightElement, setSelectedAssetRightElement] =
    useState<AssetConfiguration["rightElement"]>("undefined");
  const [selectedNetworkLeftElement, setSelectedNetworkLeftElement] =
    useState<NetworkConfiguration["leftElement"]>("undefined");
  const [selectedNetworkRightElement, setSelectedNetworkRightElement] =
    useState<NetworkConfiguration["rightElement"]>("undefined");

  const handleAccountSelected = useCallback(() => {
    Alert.alert("Account Selected", "An account has been selected via MAD flow");
  }, []);

  const handleToggleDrawer = useCallback(() => {
    openDrawer({
      enableAccountSelection,
      onAccountSelected: enableOnAccountSelected ? handleAccountSelected : undefined,
      flow: "debug_flow",
      source: "debug_source",
      assetsConfiguration: {
        leftElement: getElement(selectedAssetLeftElement),
        rightElement: getElement(selectedAssetRightElement),
      },
      networksConfiguration: {
        leftElement: getElement(selectedNetworkLeftElement),
        rightElement: getElement(selectedNetworkRightElement),
      },
    });
  }, [
    openDrawer,
    handleAccountSelected,
    enableAccountSelection,
    enableOnAccountSelected,
    selectedAssetLeftElement,
    selectedAssetRightElement,
    selectedNetworkLeftElement,
    selectedNetworkRightElement,
  ]);

  return (
    <Box lx={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SectionCard>
          <Text typography="body2" lx={{ color: "muted" }}>
            {
              "Test the Modular Drawer with different configurations. Adjust settings below to explore various behaviors and features."
            }
          </Text>
        </SectionCard>

        <SectionCard title="Feature Flag">
          {(["llmModularDrawer"] as const).map(flag => (
            <FeatureFlagDetails
              key={flag}
              focused={isFocused}
              flagName={flag}
              setFocusedName={v => setIsFocused(v === flag)}
            />
          ))}
        </SectionCard>

        <SectionCard title="Basic Configuration">
          <ToggleRow
            label="Add Account / Account Selection"
            description="Allow users to add an account or select specific accounts"
            value={enableAccountSelection}
            onChange={setEnableAccountSelection}
          />

          <Divider />

          <ToggleRow
            label="Selection Callback"
            description="Enable callback when account is selected"
            value={enableOnAccountSelected}
            onChange={setEnableOnAccountSelected}
          />
        </SectionCard>

        <SectionCard title="Assets Configuration">
          <PickerField
            label="Left Element"
            description="Choose what to display on the left side of asset rows"
            value={selectedAssetLeftElement || "undefined"}
            onValueChange={makeOnValueChange(assetsLeftElementOptions, setSelectedAssetLeftElement)}
            options={assetLeftOptions}
          />

          <PickerField
            label="Right Element"
            description="Choose what to display on the right side of asset rows"
            value={selectedAssetRightElement || "undefined"}
            onValueChange={makeOnValueChange(
              assetsRightElementOptions,
              setSelectedAssetRightElement,
            )}
            options={assetRightOptions}
          />
        </SectionCard>

        <SectionCard title="Networks Configuration">
          <PickerField
            label="Left Element"
            description="Choose what to display on the left side of network rows"
            value={selectedNetworkLeftElement || "undefined"}
            onValueChange={makeOnValueChange(
              networksLeftElementOptions,
              setSelectedNetworkLeftElement,
            )}
            options={networkLeftOptions}
          />

          <PickerField
            label="Right Element"
            description="Choose what to display on the right side of network rows"
            value={selectedNetworkRightElement || "undefined"}
            onValueChange={makeOnValueChange(
              networksRightElementOptions,
              setSelectedNetworkRightElement,
            )}
            options={networkRightOptions}
          />
        </SectionCard>

        <SectionCard title="Current Configuration">
          <Box lx={{ rowGap: "s4" }}>
            <Text typography="body2" lx={{ color: "muted" }}>
              <Text typography="body2SemiBold">{"Account Selection:"}</Text>
              {enableAccountSelection ? " Enabled" : " Disabled"}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              <Text typography="body2SemiBold">{"Selection Callback:"}</Text>
              {enableOnAccountSelected ? " Enabled" : " Disabled"}
            </Text>
          </Box>
        </SectionCard>
      </ScrollView>

      <Box
        lx={{ paddingHorizontal: "s12", paddingTop: "s4", backgroundColor: "canvas" }}
        style={{
          paddingBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Button size="lg" appearance="accent" isFull onPress={handleToggleDrawer}>
          {"Open Modular Drawer"}
        </Button>
      </Box>
    </Box>
  );
}

export default ModularDrawerScreenDebug;
