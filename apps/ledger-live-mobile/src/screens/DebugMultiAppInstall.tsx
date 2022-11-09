import React, { useMemo, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import NavigationScrollView from "../components/NavigationScrollView";
import InstallSetOfApps from "../components/DeviceAction/InstallSetOfApps";
import SelectDevice from "../components/SelectDevice";

export default function DebugMultiAppInstall() {
  const feature = useFeature("deviceInitialApps");
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isCompleted, setOnCompleted] = useState(false);
  const [nonce, setNonce] = useState(0);

  const onReset = useCallback(() => {
    setNonce(nonce => nonce + 1);
  }, []);

  const list = feature?.params?.apps || [];
  const [device, setDevice] = useState<Device | null>(null);
  const productName = useMemo(() => {
    if (!device) return "";
    return getDeviceModel(device.modelId).productName;
  }, [device]);

  const formatEstimatedTime = (estimatedTime: number) =>
    t("installSetOfApps.landing.estimatedTime", {
      minutes: estimatedTime / 60,
    });

  return (
    <NavigationScrollView>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {device ? (
          <VerticalTimeline
            steps={[
              {
                key: "fakeStep0",
                title: "Secret Recovery Phrase set",
                status: "completed",
                renderBody: () => (
                  <Text variant="bodyLineHeight">{"Some initial step"}</Text>
                ),
              },
              feature?.enabled
                ? {
                    key: "fakeStep1",
                    title: `${productName} applications`,
                    status: isCompleted ? "completed" : "active",
                    estimatedTime: 60,
                    renderBody: (isDisplayed: boolean) =>
                      isDisplayed ? (
                        <InstallSetOfApps
                          key={nonce}
                          device={device}
                          onResult={() => setOnCompleted(true)}
                          onError={onReset}
                          dependencies={list}
                        />
                      ) : (
                        <View
                          style={{
                            height: Math.max(90 + list.length * 50, 300),
                          }}
                        />
                      ),
                  }
                : null,
              {
                key: "fakeStep3",
                title: `${productName} is ready`,
                status: isCompleted ? "active" : "inactive",
                renderBody: () => null,
              },
            ].filter(Boolean)}
            formatEstimatedTime={formatEstimatedTime}
          />
        ) : (
          <SelectDevice onSelect={setDevice} />
        )}
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    padding: 16,
  },
  box: {
    padding: 10,
  },
});
