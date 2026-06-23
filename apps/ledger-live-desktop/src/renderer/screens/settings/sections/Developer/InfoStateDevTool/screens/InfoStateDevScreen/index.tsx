import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft, Search } from "@ledgerhq/lumen-ui-react/symbols";
import { DialogBackgroundToneProvider } from "LLD/components/DialogBackgroundGradient";
import { InfoState } from "LLD/components/InfoState";
import type { InfoStatePreset, InfoStateProps } from "LLD/components/InfoState/types";

const presetOptions: InfoStatePreset[] = [
  "illustration",
  "spot",
  "success",
  "error",
  "info",
  "text",
];
const sizeOptions: Array<NonNullable<InfoStateProps["size"]>> = ["full-height", "hug"];
const cyclePresets: InfoStatePreset[] = ["error", "info", "success", "text"];

export default function InfoStateDevScreen() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<InfoStatePreset>("success");
  const [size, setSize] = useState<NonNullable<InfoStateProps["size"]>>("full-height");
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showPrimaryCta, setShowPrimaryCta] = useState(true);
  const [showSecondaryCta, setShowSecondaryCta] = useState(true);
  const [useLongTitle, setUseLongTitle] = useState(false);
  const [useLongDescription, setUseLongDescription] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCyclePreviewOpen, setIsCyclePreviewOpen] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);

  const title = useLongTitle ? longTitle : `${formatPresetLabel(preset)} state title`;
  const description = useLongDescription
    ? longDescription
    : "Use this component for focused feedback and next-step guidance.";

  return (
    <div className="flex min-h-0 flex-1 flex-col p-8 pb-16" data-testid="info-state-dev-screen">
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
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          InfoState playground
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-4">
        <p className="body-2 text-muted">
          Local playground for the reusable desktop info-state component.
        </p>

        <section className="flex w-full flex-col gap-16 rounded-lg bg-surface p-16">
          <h2 className="body-2-semi-bold text-base">Playground controls</h2>

          <SettingSection title="Preset">
            {presetOptions.map(presetOption => (
              <ChoiceButton
                key={presetOption}
                label={formatPresetLabel(presetOption)}
                selected={presetOption === preset}
                onPress={() => setPreset(presetOption)}
              />
            ))}
          </SettingSection>

          <SettingSection title="Size">
            {sizeOptions.map(sizeOption => (
              <ChoiceButton
                key={sizeOption}
                label={sizeOption}
                selected={sizeOption === size}
                onPress={() => setSize(sizeOption)}
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
              label="Banner"
              enabled={showBanner}
              onPress={() => setShowBanner(value => !value)}
            />
            <ToggleButton
              label="Primary CTA"
              enabled={showPrimaryCta}
              onPress={() => setShowPrimaryCta(value => !value)}
            />
            <ToggleButton
              label="Secondary CTA"
              enabled={showSecondaryCta}
              onPress={() => setShowSecondaryCta(value => !value)}
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
            data-testid="info-state-open-preview"
          >
            Open preview
          </Button>

          <Button
            appearance="gray"
            size="lg"
            onClick={() => {
              setCycleIndex(0);
              setIsCyclePreviewOpen(true);
            }}
            data-testid="info-state-open-cycle-preview"
          >
            Open tone cycle preview
          </Button>
        </section>
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-w-[480px] overflow-hidden"
          data-testid="info-state-preview-dialog"
        >
          <DialogBackgroundToneProvider>
            <DialogHeader density="compact" onClose={() => setIsPreviewOpen(false)} />
            <DialogBody className="px-24 pb-24">
              {renderInfoStatePreview({
                preset,
                size,
                title: showTitle ? title : undefined,
                description: showDescription ? description : undefined,
                banner: showBanner
                  ? {
                      title: "Important information",
                      description: "This optional banner sits before the action stack.",
                      appearance: "info",
                    }
                  : undefined,
                primaryCta: showPrimaryCta
                  ? {
                      label: "Primary action",
                      onPress: () => undefined,
                      testID: "info-state-primary-cta",
                    }
                  : undefined,
                secondaryCta: showSecondaryCta
                  ? {
                      label: "Secondary action",
                      onPress: () => undefined,
                      testID: "info-state-secondary-cta",
                    }
                  : undefined,
              })}
            </DialogBody>
          </DialogBackgroundToneProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isCyclePreviewOpen} onOpenChange={setIsCyclePreviewOpen}>
        <DialogContent
          className="max-w-[480px] overflow-hidden"
          data-testid="info-state-cycle-preview-dialog"
        >
          <DialogBackgroundToneProvider>
            <DialogHeader density="compact" onClose={() => setIsCyclePreviewOpen(false)} />
            <DialogBody className="px-24 pb-24">
              {renderCycleInfoState({
                preset: cyclePresets[cycleIndex],
                nextPreset: cyclePresets[(cycleIndex + 1) % cyclePresets.length],
                onNext: () => setCycleIndex(index => (index + 1) % cyclePresets.length),
              })}
            </DialogBody>
          </DialogBackgroundToneProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderCycleInfoState({
  preset,
  nextPreset,
  onNext,
}: Readonly<{
  preset: InfoStatePreset;
  nextPreset: InfoStatePreset;
  onNext: () => void;
}>) {
  const commonProps: Pick<InfoStateProps, "size" | "title" | "description" | "primaryCta"> = {
    size: "hug",
    title: `${formatPresetLabel(preset)} state`,
    description: "Tap the primary action to cycle to the next tone without closing the dialog.",
    primaryCta: {
      label: `Next: ${formatPresetLabel(nextPreset)}`,
      onPress: onNext,
      testID: "info-state-cycle-next-cta",
    },
  };

  switch (preset) {
    case "success":
      return <InfoState {...commonProps} preset="success" testID="info-state-cycle-preview" />;
    case "error":
      return <InfoState {...commonProps} preset="error" testID="info-state-cycle-preview" />;
    case "info":
      return <InfoState {...commonProps} preset="info" testID="info-state-cycle-preview" />;
    case "text":
      return <InfoState {...commonProps} preset="text" testID="info-state-cycle-preview" />;
    default:
      throw new Error(`Unsupported cycle preset: ${preset}`);
  }
}

function renderInfoStatePreview({
  preset,
  ...commonProps
}: Readonly<
  Pick<
    InfoStateProps,
    "banner" | "description" | "primaryCta" | "secondaryCta" | "size" | "title"
  > & {
    preset: InfoStatePreset;
  }
>) {
  switch (preset) {
    case "illustration":
      return (
        <InfoState
          {...commonProps}
          preset="illustration"
          illustration={<div className="h-full w-full rounded-sm bg-muted" />}
          testID="info-state-preview"
        />
      );
    case "spot":
      return (
        <InfoState
          {...commonProps}
          preset="spot"
          spotProps={{ icon: Search }}
          testID="info-state-preview"
        />
      );
    case "success":
      return <InfoState {...commonProps} preset="success" testID="info-state-preview" />;
    case "error":
      return <InfoState {...commonProps} preset="error" testID="info-state-preview" />;
    case "info":
      return <InfoState {...commonProps} preset="info" testID="info-state-preview" />;
    case "text":
      return <InfoState {...commonProps} preset="text" testID="info-state-preview" />;
    default:
      return assertNever(preset);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${value}`);
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

function formatPresetLabel(preset: InfoStatePreset): string {
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

const longTitle =
  "A longer title that validates the centered heading behavior when the info state is used in compact desktop surfaces";

const longDescription =
  "This longer description intentionally spans several lines in constrained desktop dialogs. It helps validate the body copy line height, centered alignment, vertical rhythm, and the transition into banners and actions.";
