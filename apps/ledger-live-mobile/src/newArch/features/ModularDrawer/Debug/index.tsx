import React, { useCallback, useState, useMemo } from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { useModularDrawerController } from "../hooks/useModularDrawerController";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import FeatureFlagDetails from "~/screens/FeatureFlagsSettings/FeatureFlagDetails";
import { ScrollView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import { useTheme } from "styled-components/native";
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
  const { colors } = useTheme();

  const [includeTokens, setIncludeTokens] = useState(true);
  const [enableAccountSelection, setEnableAccountSelection] = useState(true);
  const [enableOnAccountSelected, setEnableOnAccountSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAssetLeftElement, setSelectedAssetLeftElement] =
    useState<AssetConfiguration["leftElement"]>("undefined");
  const [selectedAssetRightElement, setSelectedAssetRightElement] =
    useState<AssetConfiguration["rightElement"]>("undefined");
  const [selectedNetworkLeftElement, setSelectedNetworkLeftElement] =
    useState<NetworkConfiguration["leftElement"]>("undefined");
  const [selectedNetworkRightElement, setSelectedNetworkRightElement] =
    useState<NetworkConfiguration["rightElement"]>("undefined");

  const currencies = useMemo(() => listAndFilterCurrencies({ includeTokens }), [includeTokens]);

  const handleAccountSelected = useCallback(() => {
    Alert.alert("Account Selected", "An account has been selected via MAD flow");
  }, []);

  const handleToggleDrawer = useCallback(() => {
    openDrawer({
      currencies,
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
    currencies,
    enableAccountSelection,
    enableOnAccountSelected,
    selectedAssetLeftElement,
    selectedAssetRightElement,
    selectedNetworkLeftElement,
    selectedNetworkRightElement,
  ]);

  return (
    <Flex flex={1}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SectionCard>
          <Text variant="body" color="neutral.c80" lineHeight="20px">
            {
              "Test the Modular Drawer with different configurations. Adjust settings below to explore various behaviors and features."
            }
          </Text>
        </SectionCard>

        <SectionCard title="Feature Flag">
          {(["llmModularDrawer", "llmModularDrawerBackendData"] as const).map(flag => (
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
            label="Include Tokens"
            description="Show tokens alongside main currencies"
            value={includeTokens}
            onChange={setIncludeTokens}
          />

          <Divider />

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
          <Flex rowGap={2}>
            <Text variant="body" color="neutral.c80">
              <Text fontWeight="semiBold">{"Currencies:"}</Text> {currencies.length}
              {includeTokens ? " (including tokens)" : " (excluding tokens)"}
            </Text>
            <Text variant="body" color="neutral.c80">
              <Text fontWeight="semiBold">{"Account Selection:"}</Text>
              {enableAccountSelection ? " Enabled" : " Disabled"}
            </Text>
            <Text variant="body" color="neutral.c80">
              <Text fontWeight="semiBold">{"Selection Callback:"}</Text>
              {enableOnAccountSelected ? " Enabled" : " Disabled"}
            </Text>
          </Flex>
        </SectionCard>
      </ScrollView>

      <Flex
        px={4}
        pb={16}
        pt={2}
        backgroundColor="background.main"
        style={{
          shadowColor: colors.neutral.c100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Button size="large" type="main" onPress={handleToggleDrawer}>
          {"Open Modular Drawer "}({currencies.length} {"currencies"})
        </Button>
      </Flex>
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
