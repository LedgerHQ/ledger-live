// @flow
import React, { useState, useMemo, useCallback } from "react";
import { TextInput, StyleSheet } from "react-native";
import { useTheme, NavigationProp } from "@react-navigation/native";
import { usePlatformApp } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider";
import NavigationScrollView from "../../../components/NavigationScrollView";
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";

export default function CustomManifest({
  navigation,
}: {
  navigation: NavigationProp,
}) {
  const { colors } = useTheme();
  const {
    manifest,
    disabled,
    addLocalManifest,
    onChange,
  } = useCustomManifest();

  const onOpen = useCallback(() => {
    const json = JSON.parse(manifest);

    Array.isArray(json)
      ? json.map(m => addLocalManifest(m))
      : addLocalManifest(json);

    const params = Array.isArray(json)
      ? { platform: json[0].id, name: json[0].name }
      : { platform: json.id, name: json.name };

    navigation.navigate({
      name: ScreenName.PlatformApp,
      params,
    });
  }, [manifest, addLocalManifest, navigation]);

  return (
    <NavigationScrollView>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border },
        ]}
        value={manifest}
        onChangeText={onChange}
        placeholder="Paste your manufest json"
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
  );
}

function useCustomManifest() {
  const [manifest, setManifest] = useState("");
  const { addLocalManifest } = usePlatformApp();

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
});
