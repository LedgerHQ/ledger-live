import React, { useCallback, useEffect, useState } from "react";
import { Flex, Input, SelectInput, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useSelector } from "LLD/hooks/redux";
import { DeviceInfo, DeviceModelInfo } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import { setDrawer } from "~/renderer/drawers/Provider";
import OnboardingAppInstallStep from "~/renderer/components/OnboardingAppInstall";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useTranslation } from "react-i18next";
import DeveloperOpenRow from "../components/DeveloperOpenRow";

type Steps = NonNullable<React.ComponentProps<typeof VerticalTimeline>["steps"]>;
type Step = Steps[number] & { key: number };

const defaultDeviceToRestore: DeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  deviceInfo: {} as DeviceInfo,
  apps: [
    { name: "Ethereum", version: "" },
    { name: "Polygon", version: "" },
  ],
};

type SelectRestoreDeviceItem = { value: DeviceModelId | null; label: string };

const deviceToRestoreOptions: SelectRestoreDeviceItem[] = [
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
  const [deviceToRestore, setDeviceToRestore] = useState<DeviceModelInfo>(defaultDeviceToRestore);
  const [selectedDeviceToRestoreOption, setSelectedDeviceToRestoreOption] =
    useState<SelectRestoreDeviceItem | null>(deviceToRestoreOptions[0]);
  const [appsToRestore, setAppsToRestore] = useState<string[]>(
    defaultDeviceToRestore.apps.map(app => app.name),
  );
  const device = useSelector(getCurrentDevice);

  useEffect(() => {
    setDeviceToRestore(prev => ({
      ...prev,
      apps: appsToRestore.map(app => ({ name: app, version: "" })),
    }));
  }, [appsToRestore]);

  useEffect(() => {
    if (selectedDeviceToRestoreOption) {
      const modelId = selectedDeviceToRestoreOption.value;
      setRestore(modelId !== null);
      if (modelId) {
        setDeviceToRestore(prev => ({
          ...prev,
          modelId,
        }));
      }
    }
  }, [selectedDeviceToRestoreOption]);

  const handleRemount = useCallback(() => {
    setComponentKey(prev => prev + 1);
    setInstallDone(false);
    setSelectedDeviceToRestoreOption(deviceToRestoreOptions[0]);
    setAppsToRestore(defaultDeviceToRestore.apps.map(app => app.name));
    setDeviceToRestore(defaultDeviceToRestore);
  }, []);

  const steps: Step[] = [
    {
      key: 0,
      status: "completed",
      title: "Seed your device",
    },
    {
      key: 1,
      hasLoader: true,
      status: installDone ? "completed" : "active",
      title: "Install default set of apps",
      renderBody: () => (
        <OnboardingAppInstallStep
          deviceToRestore={restore ? deviceToRestore : undefined}
          device={device}
          setHeaderLoader={() => {}}
          onComplete={() => setInstallDone(true)}
          onError={() => setInstallDone(false)}
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
        <Button
          size="sm"
          appearance="transparent"
          onClick={handleRemount}
          data-testid="reset-button"
        >
          Reset
        </Button>
        <Flex ml={6} flex={1} flexDirection="column" data-testid="input-option-selector">
          <SelectInput
            isMulti={false}
            value={selectedDeviceToRestoreOption}
            options={deviceToRestoreOptions}
            onChange={setSelectedDeviceToRestoreOption}
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
      <Flex py={12} flex={1} data-testid="install-set-of-apps-container" zIndex={0}>
        <VerticalTimeline key={componentKey} flex={1} steps={steps} />
      </Flex>
    </Flex>
  );
};

const StyledOnboardingAppInstallDebugScreen = withV3StyleProvider(OnboardingAppInstallDebugScreen);

const OnboardingAppInstallDebugButton = () => {
  const { t } = useTranslation();
  const handleOpenDebugScreen = useCallback(() => {
    setDrawer(
      StyledOnboardingAppInstallDebugScreen,
      {},
      { style: { maxWidth: "640px" }, forceDisableFocusTrap: true },
    );
  }, []);

  return (
    <DeveloperOpenRow
      title={t("settings.developer.openOnboardingAppInstallDebug")}
      desc={t("settings.developer.openOnboardingAppInstallDebugDesc")}
      cta={t("settings.developer.open")}
      onOpen={handleOpenDebugScreen}
      dataTestId="debug-install-set-of-apps-button"
    />
  );
};

export default OnboardingAppInstallDebugButton;
