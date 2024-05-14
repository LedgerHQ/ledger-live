import React, { useState, useCallback, useLayoutEffect } from "react";
import { TextInput, StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useTheme, CompositeScreenProps } from "@react-navigation/native";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Box } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import { ScreenName } from "~/const";
import KeyboardView from "~/components/KeyboardView";
import ImportIcon from "~/icons/Import";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AppCard from "~/screens/Platform/Catalog/AppCard";
import Plus from "~/icons/Plus";
import Trash from "~/icons/Trash";

const DEFAULT_MANIFEST = `{
  "id": "metamask-test-dapsp",
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
}`;

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

const AddButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <Plus size={18} color={disabled ? colors.grey : colors.black} />
    </TouchableOpacity>
  );
};

type Props = CompositeScreenProps<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DeveloperCustomManifest>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function CustomManifest({ navigation }: Props) {
  const { colors } = useTheme();
  const { state: list, addLocalManifest, removeLocalManifestById } = useLocalLiveAppContext();
  const [manifest, setManifest] = useState<string | null>(null);

  const onChange = useCallback((val: string) => {
    try {
      setManifest(val);
    } catch (e) {
      setManifest(val);
    }
  }, []);

  const onOpen = useCallback(
    (id: string) => {
      const params = {
        platform: id,
      };
      navigation.navigate({
        name: ScreenName.PlatformApp,
        params,
      });
    },
    [navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Box flexDirection="row">
          <DebuggerButton onPress={() => onChange(JSON.stringify(JSON.parse(DEFAULT_MANIFEST)))} />
          <AddButton
            disabled={manifest === null}
            onPress={() => {
              manifest !== null && addLocalManifest(JSON.parse(manifest));
              setManifest(null);
            }}
          />
        </Box>
      ),
    });
  }, [addLocalManifest, manifest, navigation, onChange, onOpen, removeLocalManifestById]);

  return (
    <KeyboardView>
      <NavigationScrollView>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
            },
          ]}
          value={manifest === null ? "" : manifest}
          onChangeText={onChange}
          placeholder="Paste your manifest json"
          multiline
          autoCorrect={false}
          scrollEnabled={false}
        />
        <>
          {list.map(m => {
            return (
              <Box key={m.id} flexDirection="row">
                <TouchableOpacity
                  style={styles.appCardBox}
                  onLongPress={() => {
                    removeLocalManifestById(m.id);
                  }}
                >
                  <AppCard
                    manifest={m}
                    onPress={() => {
                      onOpen(m.id);
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => {
                    removeLocalManifestById(m.id);
                  }}
                >
                  <Trash size={18} color={colors.black} />
                </TouchableOpacity>
              </Box>
            );
          })}
        </>
      </NavigationScrollView>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  buttonBox: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  appCardBox: {
    flex: 1,
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
