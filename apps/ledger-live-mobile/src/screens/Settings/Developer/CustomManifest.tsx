import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";
import { TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, NavigationProp } from "@react-navigation/native";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import NavigationScrollView from "../../../components/NavigationScrollView";
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";
import KeyboardView from "../../../components/KeyboardView";
import ImportIcon from "../../../icons/Import";

const DebuggerButton: React.ComponentType<{
  onPress: (..._: Array<any>) => any;
  // eslint-disable-next-line react/prop-types
}> = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress}>
      <ImportIcon size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

export default function CustomManifest({
  navigation,
}: {
  navigation: NavigationProp;
}) {
  const { colors } = useTheme();
  const { manifest, disabled, addLocalManifest, onChange } =
    useCustomManifest();
  const onOpen = useCallback(() => {
    const json = JSON.parse(manifest);
    Array.isArray(json)
      ? json.map(m => addLocalManifest(m))
      : addLocalManifest(json);
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
        <DebuggerButton
          onPress={() =>
            onChange(`
            {
              "id": "debug",
              "name": "Debugger",
              "url": "https://debug.apps.ledger.com/",
              "homepageUrl": "https://developers.ledger.com/",
              "icon": "https://cdn.live.ledger.com/icons/platform/debugger.png",
              "platform": "all",
              "apiVersion": "^1.0.0 || ~0.0.1",
              "manifestVersion": "1",
              "branch": "debug",
              "categories": [
                "tools"
              ],
              "currencies": "*",
              "content": {
                "shortDescription": {
                  "en": "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk."
                },
                "description": {
                  "en": "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk."
                }
              },
              "permissions": [
                {
                  "method": "*"
                }
              ],
              "domains": [
                "http://*",
                "https://*"
              ]
            }
          `)
          }
        />
      ),
    });
  }, [navigation, onChange]);
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
        />
        <Button
          type="primary"
          title="Open"
          disabled={disabled}
          onPress={onOpen}
        />
      </NavigationScrollView>
    </KeyboardView>
  );
}

function useCustomManifest() {
  const [manifest, setManifest] = useState("");
  const { addLocalManifest } = useLocalLiveAppContext();
  const onChange = useCallback(val => {
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
