import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  Alert,
} from "react-native";
import { useTheme, CompositeScreenProps } from "@react-navigation/native";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Box, Icons, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import KeyboardView from "~/components/KeyboardView";
import ImportIcon from "~/icons/Import";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AppCard from "~/screens/Platform/Catalog/AppCard";
import Trash from "~/icons/Trash";
import { LAGADO_MANIFEST, LAGADO_MANIFEST_BUST, LAGADO_MANIFEST_NOCACHE } from "./manifests/lagado";
import {
  ONEINCH_MANIFEST,
  ONEINCH_MANIFEST_BUST,
  ONEINCH_MANIFEST_NOCACHE,
  ONEINCH_MANIFEST_V3,
} from "./manifests/1inch";
import {
  HEADERS_MANIFEST,
  HEADERS_MANIFEST_BUST,
  HEADERS_MANIFEST_NOCACHE,
} from "./manifests/headerSniffer";
import { ScrollView } from "react-native-gesture-handler";
import Clipboard from "@react-native-clipboard/clipboard";

const DebuggerButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  text?: string;
}> = ({ onPress, text }) => {
  const { colors } = useTheme();
  return (
    <Box flexDirection="row">
      {text && (
        <Text flex={1} ml={4} variant="body" fontWeight="semiBold">
          {text}
        </Text>
      )}
      <TouchableOpacity style={styles.buttons} onPress={onPress}>
        <ImportIcon size={18} color={colors.grey} />
      </TouchableOpacity>
    </Box>
  );
};

const AddButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <Icons.Plus size="S" color={disabled ? colors.grey : colors.black} />
    </TouchableOpacity>
  );
};

const DeleteTextButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <Icons.Close size="S" color={disabled ? colors.grey : colors.black} />
    </TouchableOpacity>
  );
};

const PasteButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
}> = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress}>
      <Icons.Paste size="S" color={colors.grey} />
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
        <Box flexDirection="row" alignItems="center">
          <PasteButton
            onPress={async () => {
              const text = await Clipboard.getString();

              setManifest(text);
            }}
          />
          <DeleteTextButton
            disabled={manifest === null}
            onPress={() => {
              setManifest(null);
            }}
          />
          <AddButton
            disabled={manifest === null}
            onPress={() => {
              try {
                manifest !== null && addLocalManifest(JSON.parse(manifest));
                setManifest(null);
              } catch (e) {
                Alert.alert("Invalid JSON");
              }
            }}
          />
        </Box>
      ),
    });
  }, [addLocalManifest, manifest, navigation, onChange, onOpen, removeLocalManifestById]);

  return (
    <KeyboardView>
      <ScrollView>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={manifest === null ? "" : manifest}
          onChangeText={onChange}
          placeholder="Paste your manifest json"
          placeholderTextColor={"#a3a7ad"}
          multiline
          autoCorrect={false}
          scrollEnabled={false}
        />
        <>
          <Text flex={1} ml={4} mb={4} variant="h3" fontWeight="semiBold" color={colors.fog}>
            {"Example Manifests"}
          </Text>
        </>
        <>
          <Box mt={5}>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(LAGADO_MANIFEST)))}
              text="Lagado"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(LAGADO_MANIFEST_BUST)))}
              text="Lagado cachebust"
            />
          </Box>
          <Box>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(LAGADO_MANIFEST_NOCACHE)))}
              text="Lagado nocache"
            />

            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST)))}
              text="1inch"
            />
          </Box>
          <Box>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST_V3)))}
              text="1inch v3"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST_BUST)))}
              text="1inch cachebust"
            />
          </Box>
          <Box>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST_NOCACHE)))}
              text="1inch nocache"
            />

            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(HEADERS_MANIFEST)))}
              text="Headers Sniffer"
            />
          </Box>
          <Box>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(HEADERS_MANIFEST_BUST)))}
              text="Headers Sniffer cachebust"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(HEADERS_MANIFEST_NOCACHE)))}
              text="Headers Sniffer nocache"
            />
          </Box>
        </>

        <>
          {list.length > 0 && (
            <Text flex={1} ml={4} mb={4} variant="h3" fontWeight="semiBold" color={colors.fog}>
              {"Loaded Manifests"}
            </Text>
          )}
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
      </ScrollView>
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
    height: 60,
    marginHorizontal: 10,
    padding: 5,
  },
  buttons: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
