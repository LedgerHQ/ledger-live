import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  DeviceActionContent,
  type DeviceActionContentAction,
  type SupportedDeviceActionModelId,
  supportedDeviceActionModelIds,
} from "LLD/components/DeviceActionContent";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";

const actionLabels: Record<DeviceActionContentAction, string> = {
  continue: "Continue",
  "power-and-unlock": "Power and unlock",
};

const actionOptions: DeviceActionContentAction[] = ["continue", "power-and-unlock"];

const deviceNames: Record<SupportedDeviceActionModelId, string> = {
  [DeviceModelId.nanoS]: "Ledger Nano S CDA1",
  [DeviceModelId.nanoSP]: "Ledger Nano S Plus CDA1",
  [DeviceModelId.nanoX]: "Ledger Nano X CDA1",
  [DeviceModelId.stax]: "Ledger Stax CDA1",
  [DeviceModelId.europa]: "Ledger Flex CDA1",
  [DeviceModelId.apex]: "Ledger Apex CDA1",
};

export default function DeviceActionContentDevScreen() {
  const navigate = useNavigate();
  const [modelId, setModelId] = useState<SupportedDeviceActionModelId>(DeviceModelId.europa);
  const [action, setAction] = useState<DeviceActionContentAction>("continue");
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showDeviceName, setShowDeviceName] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [useLongTitle, setUseLongTitle] = useState(false);
  const [useLongDescription, setUseLongDescription] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const productName = getDeviceModel(modelId).productName;
  const title = useLongTitle ? longTitle : `${actionLabels[action]} your ${productName}`;
  const description = useLongDescription
    ? longDescription
    : "Keep Ledger Live open while you complete the action on your Ledger device.";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col p-8 pb-16"
      data-testid="device-action-content-dev-screen"
    >
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button
            size="sm"
            appearance="no-background"
            onClick={() => navigate("/settings/developer")}
            icon={ArrowLeft}
          >
            Back
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,34rem)] text-center text-base">
          DeviceActionContent playground
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-4">
        <p className="body-2 text-muted">
          Local playground for the reusable desktop device-action-content component.
        </p>

        <section className="flex w-full flex-col gap-16 rounded-lg bg-surface p-16">
          <h2 className="body-2-semi-bold text-base">Playground controls</h2>

          <SettingSection title="Device model">
            {supportedDeviceActionModelIds.map(deviceModelId => (
              <ChoiceButton
                key={deviceModelId}
                label={getDeviceModel(deviceModelId).productName}
                selected={deviceModelId === modelId}
                onPress={() => setModelId(deviceModelId)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Action">
            {actionOptions.map(actionOption => (
              <ChoiceButton
                key={actionOption}
                label={actionLabels[actionOption]}
                selected={actionOption === action}
                onPress={() => setAction(actionOption)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Visibility">
            <ToggleButton
              label="Title"
              enabled={showTitle}
              onPress={() => setShowTitle(value => !value)}
            />
            <ToggleButton
              label="Description"
              enabled={showDescription}
              onPress={() => setShowDescription(value => !value)}
            />
            <ToggleButton
              label="Device tag"
              enabled={showDeviceName}
              onPress={() => setShowDeviceName(value => !value)}
            />
            <ToggleButton
              label="Banner"
              enabled={showBanner}
              onPress={() => setShowBanner(value => !value)}
            />
          </SettingSection>

          <SettingSection title="Copy stress">
            <ToggleButton
              label="Long title"
              enabled={useLongTitle}
              onPress={() => setUseLongTitle(value => !value)}
            />
            <ToggleButton
              label="Long description"
              enabled={useLongDescription}
              onPress={() => setUseLongDescription(value => !value)}
            />
          </SettingSection>

          <Button
            appearance="base"
            size="lg"
            onClick={() => setIsPreviewOpen(true)}
            data-testid="device-action-content-open-preview"
          >
            Open preview
          </Button>
        </section>
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-w-[480px] overflow-hidden"
          data-testid="device-action-content-preview-dialog"
        >
          <DialogHeader density="compact" onClose={() => setIsPreviewOpen(false)} />
          <DialogBody className="px-24 pb-24">
            <DeviceActionContent
              title={showTitle ? title : undefined}
              description={showDescription ? description : undefined}
              deviceName={showDeviceName ? deviceNames[modelId] : undefined}
              deviceModelId={modelId}
              action={action}
              banner={
                showBanner
                  ? {
                      title: useLongTitle
                        ? "A long banner title that checks wrapping near the bottom of the content"
                        : "Make sure the device stays connected",
                      description: useLongDescription
                        ? "This banner copy is intentionally verbose so the Lumen Banner can be checked alongside the centered device copy."
                        : "Do not disconnect the cable or close the app during this step.",
                      appearance: action === "continue" ? "info" : "warning",
                    }
                  : undefined
              }
              testID="device-action-content-preview"
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-8">
      <span className="body-2 text-muted">{title}</span>
      <div className="flex flex-row flex-wrap gap-8">{children}</div>
    </div>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>) {
  return (
    <Button appearance={selected ? "base" : "gray"} size="sm" onClick={onPress}>
      {label}
    </Button>
  );
}

function ToggleButton({
  label,
  enabled,
  onPress,
}: Readonly<{
  label: string;
  enabled: boolean;
  onPress: () => void;
}>) {
  return (
    <Button appearance={enabled ? "base" : "gray"} size="sm" onClick={onPress}>
      {label}: {enabled ? "On" : "Off"}
    </Button>
  );
}

const longTitle =
  "Continue on your Ledger device and carefully review every instruction before approving this unusually long action title";

const longDescription =
  "This description intentionally spans multiple lines in compact dialogs. It helps validate centered body copy, spacing between the title and description, and the transition into the banner without clipping or overlapping content.";
