import React, { useCallback, useEffect, useState } from "react";
import { Button, Flex, Input, SelectInput, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { DeviceInfo, DeviceModelInfo } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/types-devices";
import { DeviceModelId } from "@ledgerhq/devices";

import ButtonV2 from "~/renderer/components/Button";
import { setDrawer } from "~/renderer/drawers/Provider";
import OnboardingAppInstallStep from "~/renderer/components/OnboardingAppInstall";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const defaultRestoreDevice: DeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: {} as DeviceInfo,
  apps: [
    { name: "Ethereum", version: "" },
    { name: "Polygon", version: "" },
  ],
};

type SelectRestoreDeviceItem = { value: DeviceModelId | null; label: string };

const restoreDeviceOptions: SelectRestoreDeviceItem[] = [
  { value: null, label: "Use default apps" },
  { value: DeviceModelId.nanoX, label: "Restore from Nano X" },
  { value: DeviceModelId.nanoSP, label: "Restore from Nano S Plus" },
  { value: DeviceModelId.nanoS, label: "Restore from Nano S" },
  { value: DeviceModelId.stax, label: "Restore from Ledger Stax" },
];

const OnboardingAppInstallDebugScreen = () => {
  const [restore, setRestore] = useState<boolean>(false);
  const [componentKey, setComponentKey] = useState<number>(1);
  const [installDone, setInstallDone] = useState<boolean>(false);
  const [restoreDevice, setRestoreDevice] = useState<DeviceModelInfo>(defaultRestoreDevice);
  const [
    selectedRestoreDeviceOption,
    setSelectedRestoreDeviceOption,
  ] = useState<SelectRestoreDeviceItem | null>(restoreDeviceOptions[0]);
  const [appsToRestore, setAppsToRestore] = useState<string[]>(
    defaultRestoreDevice.apps.map(app => app.name),
  );
  const device = useSelector(getCurrentDevice);

  useEffect(() => {
    setRestoreDevice(prev => ({
      ...prev,
      apps: appsToRestore.map(app => ({ name: app, version: "" })),
    }));
  }, [appsToRestore]);

  useEffect(() => {
    if (selectedRestoreDeviceOption) {
      setRestore(selectedRestoreDeviceOption.value !== null);
      if (selectedRestoreDeviceOption.value) {
        setRestoreDevice(prev => ({
          ...prev,
          modelId: selectedRestoreDeviceOption.value as DeviceModelId,
        }));
      }
    }
  }, [selectedRestoreDeviceOption]);

  const handleRemount = useCallback(() => {
    setComponentKey(prev => prev + 1);
    setInstallDone(false);
    setSelectedRestoreDeviceOption(restoreDeviceOptions[0]);
    setAppsToRestore(defaultRestoreDevice.apps.map(app => app.name));
    setRestoreDevice(defaultRestoreDevice);
  }, []);

  const steps = [
    {
      key: 0,
      status: "completed",
      title: "Seed your device",
    },
    {
      key: 1,
      estimatedTime: 120,
      status: installDone ? "completed" : "active",
      title: "Install default set of apps",
      renderBody: () => (
        <OnboardingAppInstallStep
          restoreDevice={restore ? restoreDevice : undefined}
          device={device as Device}
          onComplete={() => setInstallDone(true)}
        />
      ),
    },
    {
      key: 2,
      status: installDone ? "completed" : "inactive",
      title: "Complete onboarding",
    },
  ];

  return (
    <Flex px={12} flexDirection="column">
      <Text variant="h2" fontWeight="semiBold">
        Onboarding apps installer
      </Text>
      <Flex pt={8} alignItems="center">
        <Button mr={6} variant="main" outline={true} onClick={handleRemount}>
          Reset
        </Button>
        <Flex flex={1} flexDirection="column">
          <SelectInput
            isMulti={false}
            value={selectedRestoreDeviceOption}
            options={restoreDeviceOptions}
            onChange={setSelectedRestoreDeviceOption}
          />
        </Flex>
      </Flex>
      {restore && (
        <Flex mt={8} flexDirection="column">
          <Text mb={4} variant="paragraph">
            Apps to restore (capitalized, separated by comma and space)
          </Text>
          <Input
            onChange={value => {
              setAppsToRestore(value.split(", "));
            }}
            value={appsToRestore.join(", ")}
          />
        </Flex>
      )}
      <Flex py={12} flex={1}>
        <VerticalTimeline key={componentKey} flex={1} steps={steps} />
      </Flex>
    </Flex>
  );
};

const StyledOnboardingAppInstallDebugScreen = withV3StyleProvider(OnboardingAppInstallDebugScreen);

const OnboardingAppInstallDebugButton = () => {
  const handleOpenDebugScreen = useCallback(() => {
    setDrawer(
      StyledOnboardingAppInstallDebugScreen,
      {},
      { style: { maxWidth: "640px" }, forceDisableFocusTrap: true },
    );
  }, []);

  return (
    <ButtonV2 small primary onClick={handleOpenDebugScreen}>
      Open
    </ButtonV2>
  );
};

export default OnboardingAppInstallDebugButton;
