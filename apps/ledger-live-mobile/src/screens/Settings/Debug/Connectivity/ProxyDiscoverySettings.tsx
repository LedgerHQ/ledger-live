import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import TextInput from "~/components/TextInput";
import Button from "~/components/Button";
import { useEffectiveProxyUrl } from "~/transport/useEffectiveProxyUrl";

const DEFAULT_PORT = "8435";

const normalizeWsProxyUrl = (rawInput: string): string | null => {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed;
  }

  const match = trimmed.match(/^([\w.:]+?)(?::(\d+))?$/);
  if (!match) return null;

  const [, host, port] = match;
  return `ws://${host}:${port ?? DEFAULT_PORT}`;
};

export const ProxyDiscoverySettings = () => {
  const { envProxyUrl, storeProxyUrl, effectiveProxyUrl, setProxyUrl, clearProxyUrl } =
    useEffectiveProxyUrl();
  const [urlInput, setUrlInput] = useState(effectiveProxyUrl ?? "");

  useEffect(() => {
    setUrlInput(effectiveProxyUrl ?? "");
  }, [effectiveProxyUrl]);

  const effectiveSource = useMemo(() => {
    if (storeProxyUrl) return "store";
    if (envProxyUrl) return "env";
    return "none";
  }, [storeProxyUrl, envProxyUrl]);

  const onSet = useCallback(() => {
    const normalized = normalizeWsProxyUrl(urlInput);
    if (!normalized) return;
    setProxyUrl(normalized);
  }, [urlInput, setProxyUrl]);

  const onClear = useCallback(() => {
    clearProxyUrl();
  }, [clearProxyUrl]);

  return (
    <View style={styles.container}>
      <Text variant="h5" fontWeight="semiBold" mb={3}>
        WS Proxy URL
      </Text>
      <Text variant="small" color="neutral.c70" mb={4}>
        {Platform.OS === "android"
          ? "On Android emulator, use ws://10.0.2.2:8435 to reach the host machine."
          : "On iOS simulator, use ws://localhost:8435 to reach the host machine."}
        {"\n"}For a physical device, use your computer{"'"}s LAN IP (e.g. ws://192.168.x.x:8435).
      </Text>

      <Flex flexDirection="row" alignItems="center" mb={4}>
        <Flex flex={1} mr={3}>
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="always"
            placeholder={Platform.OS === "android" ? "ws://10.0.2.2:8435" : "ws://localhost:8435"}
            returnKeyType="done"
            onSubmitEditing={onSet}
          />
        </Flex>
        <Button
          disabled={!urlInput.trim()}
          type="primary"
          event="DebugWsProxyConnect"
          onPress={onSet}
          title="Set"
        />
      </Flex>

      <Flex p={4} mb={effectiveProxyUrl ? 3 : 6} borderRadius={8} backgroundColor="neutral.c20">
        <Text variant="small" color="neutral.c70">
          Env URL
        </Text>
        <Text variant="body" numberOfLines={1}>
          {envProxyUrl ?? "none"}
        </Text>
        <Text variant="small" color="neutral.c70" mt={3}>
          Store URL
        </Text>
        <Text variant="body" numberOfLines={1}>
          {storeProxyUrl ?? "none"}
        </Text>
        <Text variant="small" color="neutral.c70" mt={3}>
          Effective URL ({effectiveSource})
        </Text>
        <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
          {effectiveProxyUrl ?? "none"}
        </Text>
      </Flex>

      {effectiveProxyUrl ? (
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          p={4}
          mb={6}
          borderRadius={8}
          backgroundColor="neutral.c20"
        >
          <Flex flex={1} mr={3}>
            <Text variant="small" color="neutral.c70">
              Active proxy
            </Text>
            <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
              {effectiveProxyUrl}
            </Text>
          </Flex>
          <Button type="error" event="DebugWsProxyDisconnect" onPress={onClear} title="Clear" />
        </Flex>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
