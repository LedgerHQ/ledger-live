import React, { useState, useCallback } from "react";
import { View, Text } from "react-native";
import Config from "react-native-config";
import { setEnvUnsafe } from "@ledgerhq/live-common/env";
import NavigationScrollView from "../components/NavigationScrollView";
import Button from "../components/Button";
import TextInput from "../components/TextInput";

export default function DebugEnv() {
  const [value, setValue] = useState();
  const [status, setStatus] = useState();
  const onSetEnv = useCallback(() => {
    if (!value) return;
    // Attempt to parse this input
    const match = /([\w]+)=([\w]+)/.exec(value);

    if (!match || match.length !== 3) {
      setStatus("Can't parse input");
    } else if (match[2] === "0") {
      setStatus(`Unsetting ${match[1]}`);
      setEnvUnsafe(match[1], match[2]);
      delete Config[match[1]];
    } else {
      setStatus(`Set value '${match[2]}' for '${match[1]}'`);
      Config[match[1]] = match[2];
      setEnvUnsafe(match[1], match[2]);
    }
  }, [value]);
  return (
    <NavigationScrollView>
      <View
        style={{
          padding: 16,
          flex: 1,
        }}
      >
        <Text>{status}</Text>
        <TextInput
          maxLength={100}
          onChangeText={setValue}
          placeholder={"DEBUG_THEME=1"}
        />
        <Button
          event="DebugEnv"
          type="primary"
          title={"Set env"}
          containerStyle={{
            marginBottom: 16,
          }}
          onPress={onSetEnv}
        />
      </View>
    </NavigationScrollView>
  );
}
