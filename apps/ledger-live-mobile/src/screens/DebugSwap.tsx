import React, { useEffect, useMemo, useState, useCallback } from "react";
import Config from "react-native-config";
import { View, StyleSheet } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Button from "../components/Button";
import CheckBox from "../components/CheckBox";
import Alert from "../components/Alert";
import { setSwapKYCStatus } from "../actions/settings";
import { swapKYCSelector } from "../reducers/settings";
import LText from "../components/LText";
import Touchable from "../components/Touchable";

export default function DebugSwap() {
  const dispatch = useDispatch();
  const swapKYC = useSelector(swapKYCSelector);
  const [configWrapper, setConfigWrapper] = useState(
    Config.SWAP_DISABLED_PROVIDERS || "",
  );
  const [configIDWrapper, setConfigIDWrapper] = useState(
    Config.SWAP_OVERRIDE_KYC_USER_ID || "",
  );
  const onToggleWyreId = useCallback(() => {
    setConfigIDWrapper(configIDWrapper ? "" : "wadus");
  }, [configIDWrapper]);
  const onFlushWyreKYC = useCallback(() => {
    dispatch(
      setSwapKYCStatus({
        provider: "wyre",
      }),
    );
  }, [dispatch]);
  const currentDisabledProviders = useMemo(
    () => configWrapper.split(","),
    [configWrapper],
  );
  const onToggleProvider = useCallback(
    provider => {
      if (currentDisabledProviders.includes(provider)) {
        setConfigWrapper(
          currentDisabledProviders.filter(p => p !== provider).join(","),
        );
      } else {
        setConfigWrapper([...currentDisabledProviders, provider].join(","));
      }
    },
    [currentDisabledProviders],
  );
  useEffect(() => {
    Config.SWAP_DISABLED_PROVIDERS = configWrapper;
  }, [configWrapper]);
  useEffect(() => {
    Config.SWAP_OVERRIDE_KYC_USER_ID = configIDWrapper;
  }, [configIDWrapper]);
  return (
    <View style={styles.wrapper}>
      <Alert type={"danger"}>
        {
          "These actions are meant to aid qa and development, use at your own risk"
        }
      </Alert>
      <Button
        containerStyle={styles.button}
        type="primary"
        disabled={!swapKYC?.wyre}
        title={"Flush KYC"}
        onPress={onFlushWyreKYC}
      />
      <Touchable
        onPress={() => onToggleProvider("changelly")}
        style={styles.switchRow}
      >
        <CheckBox isChecked={currentDisabledProviders.includes("changelly")} />
        <LText semiBold style={styles.switchLabel}>
          {"Disable Changelly"}
        </LText>
      </Touchable>
      <Touchable
        onPress={() => onToggleProvider("cic")}
        style={styles.switchRow}
      >
        <CheckBox isChecked={currentDisabledProviders.includes("cic")} />
        <LText semiBold style={styles.switchLabel}>
          {"Disable CIC"}
        </LText>
      </Touchable>
      <Touchable
        onPress={() => onToggleProvider("wyre")}
        style={styles.switchRow}
      >
        <CheckBox isChecked={currentDisabledProviders.includes("wyre")} />
        <LText semiBold style={styles.switchLabel}>
          {"Disable Wyre"}
        </LText>
      </Touchable>
      <Touchable onPress={onToggleWyreId} style={styles.switchRow}>
        <CheckBox isChecked={!!configIDWrapper} />
        <LText semiBold style={styles.switchLabel}>
          {"Use invalid Wyre ID"}
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
