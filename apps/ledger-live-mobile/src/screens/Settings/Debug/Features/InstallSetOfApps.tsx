import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Button, Flex, SelectableList, Switch, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import { DeviceModelId } from "@ledgerhq/types-devices";
import NavigationScrollView from "~/components/NavigationScrollView";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import SelectDevice from "~/components/SelectDevice";

export default function DebugMultiAppInstall() {
  const feature = useFeature("deviceInitialApps");
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isCompleted, setOnCompleted] = useState(false);
  const [override, setOverride] = useState(true);
  const [nonce, setNonce] = useState(0);

  const onReset = useCallback(() => {
    setNonce(nonce => nonce + 1);
  }, []);

  const onOverrideDependencies = useCallback(() => {
    setOverride(value => !value);
  }, []);

  const [device, setDevice] = useState<Device | null>(null);
  const list = override ? ["Puerto", "Bitcoin", "Ethereum", "Ripple"] : feature?.params?.apps || [];

  const formatEstimatedTime = (estimatedTime: number) =>
    t("installSetOfApps.landing.estimatedTime", {
      minutes: estimatedTime / 60,
    });

  const onComplete = useCallback(() => {
    setOnCompleted(true);
  }, []);

  const [selectedLastSeenDevice, setSelectedLastSeenDevice] = useState(DeviceModelId.stax);

  const [restoreMode, setRestoreMode] = useState(false);

  const possibleDevices = [
    {
      id: DeviceModelId.stax,
      name: DeviceModelId.stax,
    },
    {
      id: DeviceModelId.nanoX,
      name: DeviceModelId.nanoX,
    },
  ];

  return (
    <NavigationScrollView>
      <Flex px={8}>
        <Switch checked={restoreMode} onChange={setRestoreMode} label="Restore mode" />
        {restoreMode && (
          <>
            <Text py={6}>Select last model id</Text>
            <SelectableList
              currentValue={selectedLastSeenDevice}
              onChange={setSelectedLastSeenDevice}
            >
              {possibleDevices.map(device => {
                return (
                  <SelectableList.Element key={device.id} value={device.id}>
                    {device.name}
                  </SelectableList.Element>
                );
              })}
            </SelectableList>
          </>
        )}
      </Flex>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {device ? (
          <VerticalTimeline
            steps={[
              {
                key: "fakeStep0",
                title: "Dummy step completed #1",
                status: "completed",
              },
              {
                key: "fakeStep1",
                title: "Dummy step completed #2",
                status: "completed",
              },
              feature?.enabled
                ? {
                    key: "fakeStep2",
                    title: isCompleted ? "Blockchain apps installed" : "Install Blockchain apps",
                    status: isCompleted ? "completed" : "active",
                    estimatedTime: 180,
                    renderBody: (isDisplayed: boolean) =>
                      isDisplayed ? (
                        <InstallSetOfApps
                          restore={restoreMode}
                          key={`${nonce}_installSetOfApps`}
                          device={device}
                          onResult={onComplete}
                          onError={onReset}
                          dependencies={list}
                          debugLastSeenDeviceModelId={selectedLastSeenDevice}
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
                title: `End of setup`,
                status: isCompleted ? "active" : "inactive",
              },
            ].filter(Boolean)}
            formatEstimatedTime={formatEstimatedTime}
          />
        ) : (
          <Flex>
            <SelectDevice onSelect={setDevice} />
            <Button type="main" onPress={onOverrideDependencies}>
              {override ? "Use app list from feature flag" : "Use known bad app list"}
            </Button>
          </Flex>
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
