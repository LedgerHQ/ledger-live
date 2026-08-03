import React from "react";
import {
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { AnalyticsConsentDialog } from "LLD/features/AnalyticsConsentDialog";
import Box from "~/renderer/components/Box";
import {
  scenarioConfirmMessage,
  useAnalyticsConsentOptInQaViewModel,
  type AnalyticsConsentOptInQaViewModel,
  type InspectorField,
  type ToggleField,
} from "./useAnalyticsConsentOptInQaViewModel";

const TONE_TEXT: Record<string, string> = {
  error: "text-error",
  warning: "text-warning",
  success: "text-success",
  gray: "text-muted",
};

function confirmAction(message: string): boolean {
  return window.confirm(message);
}

function InspectorRow({ field }: Readonly<{ field: InspectorField }>) {
  return (
    <div className="flex min-w-0 flex-col gap-8 rounded-sm border border-muted p-12">
      <div className="flex items-center justify-between gap-8">
        <span className="body-2-semi-bold min-w-0 flex-1 text-base">{field.label}</span>
        <Tag
          label={field.status.label}
          size="sm"
          appearance={field.status.tone}
          className="shrink-0"
        />
      </div>
      <span className="body-2-semi-bold select-text text-base">{field.value}</span>
      {field.raw ? <span className="body-3 select-text text-muted">{field.raw}</span> : null}
    </div>
  );
}

function ToggleRow({ field }: Readonly<{ field: ToggleField }>) {
  return (
    <div className="flex min-w-0 flex-col gap-8 rounded-sm border border-muted p-12">
      <div className="flex items-center justify-between gap-8">
        <span className="body-2-semi-bold min-w-0 flex-1 text-base">{field.label}</span>
        <Tag
          label={field.value ? "On" : "Off"}
          size="sm"
          appearance={field.value ? "success" : "gray"}
          className="shrink-0"
        />
      </div>
      <div className="flex justify-end">
        <Switch name={field.label} selected={field.value} onChange={field.onChange} />
      </div>
      {field.note ? <span className="body-3 text-warning">{field.note}</span> : null}
    </div>
  );
}

function GroupLabel({
  first,
  meta,
}: Readonly<{
  first?: boolean;
  meta: AnalyticsConsentOptInQaViewModel["scenariosByGroup"][number]["meta"];
}>) {
  return (
    <div className={`mb-8 flex items-center gap-8 ${first ? "" : "mt-16"}`}>
      <Tag label={meta.title} size="sm" appearance={meta.tone} />
      <span className="body-3 flex-1 text-muted">{meta.hint}</span>
    </div>
  );
}

export function AnalyticsConsentOptInDevScreen() {
  const vm = useAnalyticsConsentOptInQaViewModel();

  return (
    <Box grow shrink className="p-8 pb-16">
      {vm.isPreviewMounted ? <AnalyticsConsentDialog key={vm.previewKey} /> : null}
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={vm.onBack} icon={ArrowLeft}>
            Back
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          Analytics consent QA
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-20 px-4 md:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
        <aside className="self-start md:sticky md:top-8">
          <section className="rounded-xl bg-surface p-16">
            <p className="body-3 mb-6 text-muted">What happens now?</p>
            <h2 className={`heading-2-semi-bold mb-6 ${TONE_TEXT[vm.headlineTone] ?? "text-base"}`}>
              {vm.headline}
            </h2>
            <p className="body-3 mb-14 text-muted">{vm.headlineHint}</p>

            <div className="mb-14 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <span className="body-3 text-muted">Reason</span>
                <span className="body-2-semi-bold text-base">{vm.reasonLabel}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="body-3 text-muted">Analytics tracking</span>
                <span
                  className={`body-2-semi-bold ${vm.trackingEnabled ? "text-success" : "text-error"}`}
                >
                  {vm.trackingEnabled ? "On" : "Off"}
                  {vm.trackingPausedUntilAnswered ? " · paused until answered" : ""}
                </span>
              </div>
            </div>

            <Divider />

            <div className="mt-14 flex flex-col gap-6">
              <Button
                appearance="accent"
                size="sm"
                disabled={!vm.isEligibleForDrawer}
                onClick={vm.onPreviewDialog}
              >
                Preview drawer
              </Button>
              <p className="body-3 text-muted">{vm.previewHint}</p>
            </div>
          </section>
        </aside>

        <section className="min-w-0 rounded-xl bg-surface p-16">
          <div className="mb-14 flex items-center gap-8">
            <div className="min-w-0 flex-1">
              <SegmentedControl
                selectedValue={vm.tab}
                onSelectedChange={vm.setTab}
                tabLayout="fit"
                aria-label="Analytics consent QA sections"
              >
                <SegmentedControlButton value="scenarios">Scenarios</SegmentedControlButton>
                <SegmentedControlButton value="inspect">Inspect</SegmentedControlButton>
              </SegmentedControl>
            </div>
            <Button
              appearance="no-background"
              size="sm"
              disabled={vm.isAlreadyReset}
              onClick={() => {
                if (
                  confirmAction(
                    "Clears saved consent and analytics preferences, and removes the local test override.",
                  )
                ) {
                  vm.onResetAll();
                }
              }}
            >
              Reset all
            </Button>
          </div>

          {vm.tab === "scenarios" ? (
            <div>
              {vm.scenariosByGroup.map(({ expected, meta, scenarios }, index) => (
                <div key={expected}>
                  <GroupLabel first={index === 0} meta={meta} />
                  <div className="grid grid-cols-3 gap-8">
                    {scenarios.map(scenario => (
                      <button
                        key={scenario.id}
                        type="button"
                        className="flex min-w-0 cursor-pointer flex-col gap-8 rounded-sm border border-muted bg-transparent p-12 text-left"
                        onClick={() => {
                          if (confirmAction(scenarioConfirmMessage(scenario))) {
                            vm.applyScenario(scenario);
                          }
                        }}
                      >
                        <Tag label={meta.title} size="sm" appearance={meta.tone} />
                        <span className="body-2-semi-bold text-base">{scenario.name}</span>
                        <span className="body-3 text-muted">{scenario.summary}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              <div>
                <p className="body-3-semi-bold mb-6 text-muted">Stored on this device</p>
                <div className="grid grid-cols-2 gap-8">
                  {vm.storedFields.map(field => (
                    <InspectorRow key={field.label} field={field} />
                  ))}
                </div>
              </div>
              <div>
                <p className="body-3-semi-bold mb-6 text-muted">From remote config</p>
                <div className="grid grid-cols-2 gap-8">
                  <ToggleRow
                    field={{
                      label: "Feature flag enabled",
                      value: vm.featureEnabled,
                      onChange: vm.overrideFlagEnabled,
                    }}
                  />
                  <InspectorRow field={vm.policyVersionField} />
                </div>
              </div>
              <div>
                <p className="body-3-semi-bold mb-6 text-muted">User preferences</p>
                <div className="grid grid-cols-2 gap-8">
                  {vm.toggleFields.map(field => (
                    <ToggleRow key={field.label} field={field} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Box>
  );
}
