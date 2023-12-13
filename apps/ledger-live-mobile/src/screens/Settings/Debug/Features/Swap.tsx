import React, { useEffect, useMemo, useState, useCallback } from "react";
import Config from "react-native-config";
import { View, StyleSheet } from "react-native";
import CheckBox from "~/components/CheckBox";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";

export default function DebugSwap() {
  const [configWrapper, setConfigWrapper] = useState(Config.SWAP_DISABLED_PROVIDERS || "");

  const currentDisabledProviders = useMemo(() => configWrapper.split(","), [configWrapper]);

  const onToggleProvider = useCallback(
    (provider: string) => {
      if (currentDisabledProviders.includes(provider)) {
        setConfigWrapper(currentDisabledProviders.filter(p => p !== provider).join(","));
      } else {
        setConfigWrapper([...currentDisabledProviders, provider].join(","));
      }
    },
    [currentDisabledProviders],
  );

  useEffect(() => {
    Config.SWAP_DISABLED_PROVIDERS = configWrapper;
  }, [configWrapper]);

  return (
    <View style={styles.wrapper}>
      <Touchable onPress={() => onToggleProvider("changelly")} style={styles.switchRow}>
        <CheckBox isChecked={currentDisabledProviders.includes("changelly")} />
        <LText semiBold style={styles.switchLabel}>
          {"Disable Changelly"}
        </LText>
      </Touchable>
      <Touchable onPress={() => onToggleProvider("cic")} style={styles.switchRow}>
        <CheckBox isChecked={currentDisabledProviders.includes("cic")} />
        <LText semiBold style={styles.switchLabel}>
          {"Disable CIC"}
        </LText>
      </Touchable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 12,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 13,
    paddingRight: 16,
  },
});
