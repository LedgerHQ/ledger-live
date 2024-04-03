import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";
import { TextInput, StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useTheme, CompositeScreenProps } from "@react-navigation/native";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { Box } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import { ScreenName } from "~/const";
import KeyboardView from "~/components/KeyboardView";
import ImportIcon from "~/icons/Import";
import ArrowRight from "~/icons/ArrowRight";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const DebuggerButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
}> = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress}>
      <ImportIcon size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

const OpenButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <ArrowRight size={18} color={colors.black} />
    </TouchableOpacity>
  );
};

type Props = CompositeScreenProps<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DeveloperCustomManifest>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function CustomManifest({ navigation }: Props) {
  const { colors } = useTheme();
  const { manifest, disabled, addLocalManifest, onChange } = useCustomManifest();
  const onOpen = useCallback(() => {
    const json = JSON.parse(manifest);
    Array.isArray(json) ? json.map(m => addLocalManifest(m)) : addLocalManifest(json);
    const params = Array.isArray(json)
      ? {
          platform: json[0].id,
          name: json[0].name,
        }
      : {
          platform: json.id,
          name: json.name,
        };
    navigation.navigate({
      name: ScreenName.PlatformApp,
      params,
    });
  }, [manifest, addLocalManifest, navigation]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Box flexDirection="row">
          <DebuggerButton
            onPress={() =>
              onChange(`
{
  "id": "metamask-test-dapp",
  "name": "Metamask Test Dapp",
  "private": false,
  "url": "https://metamask.github.io/test-dapp/",
  "dapp": {
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      },
      {
        "currency": "arbitrum",
        "chainID": 42161,
        "nodeURL": "https://arb1.arbitrum.io/rpc"
      },
      {
        "currency": "optimism",
        "chainID": 10,
        "nodeURL": "https://mainnet.optimism.io"
      }
    ]
  },
  "homepageUrl": "https://metamask.github.io/test-dapp/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "1",
  "branch": "stable",
  "categories": ["tools"],
  "currencies": ["ethereum", "bsc", "polygon", "arbitrum", "optimism"],
  "content": {
    "shortDescription": {
      "en": "Metamask Test Dapp"
    },
    "description": {
      "en": "Metamask Test Dapp"
    }
  },
  "permissions": [],
  "domains": ["http://", "https://"],
  "visibility": "complete"
}

          `)
            }
          />
          <OpenButton disabled={disabled} onPress={onOpen} />
        </Box>
      ),
    });
  }, [disabled, navigation, onChange, onOpen]);
  return (
    <KeyboardView>
      <NavigationScrollView>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={manifest}
          onChangeText={onChange}
          placeholder="Paste your manifest json"
          multiline
          autoCorrect={false}
          scrollEnabled={false}
        />
      </NavigationScrollView>
    </KeyboardView>
  );
}

function useCustomManifest() {
  const [manifest, setManifest] = useState("");
  const { addLocalManifest } = useLocalLiveAppContext();
  const onChange = useCallback((val: string) => {
    try {
      const json = JSON.parse(val);
      setManifest(JSON.stringify(json, null, 2));
    } catch (e) {
      setManifest(val);
    }
  }, []);
  const disabled = useMemo(() => {
    if (!manifest) {
      return true;
    }

    try {
      JSON.parse(manifest);
      return false;
    } catch (e) {
      return true;
    }
  }, [manifest]);
  return {
    manifest,
    disabled,
    onChange,
    addLocalManifest,
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginBottom: 16,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
