import React from "react";
import { Button, Checkbox, Switch, TextInput } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import Box from "~/renderer/components/Box";
import { COPY } from "./copy";
import { ONBOARDING_DATE_PRESETS } from "./utils";
import type { LargeScreenUpsellQaViewModel } from "./useLargeScreenUpsellQaViewModel";

type Props = LargeScreenUpsellQaViewModel;

function ToggleRow({
  label,
  selected,
  onChange,
  name,
  explanation,
}: {
  label: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
  name: string;
  explanation?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-16">
        <span className="body-2 font-medium text-base">{label}</span>
        <Switch name={name} selected={selected} onChange={onChange} />
      </div>
      {explanation ? <p className="body-3 text-muted">{explanation}</p> : null}
    </div>
  );
}

function ParamRow({
  label,
  value,
  placeholder,
  onChange,
  onApply,
  onReset,
  disabled,
  testId,
  explanation,
  isOverridden,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  disabled: boolean;
  testId: string;
  explanation: string;
  isOverridden: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="body-2 font-medium text-base">{label}</span>
      <p className="body-3 text-muted">{explanation}</p>
      <div className="flex flex-nowrap items-center gap-8">
        <TextInput
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          className="min-w-0 flex-1"
          disabled={disabled}
          data-testid={testId}
        />
        <Button size="sm" appearance="base" onClick={onApply} disabled={disabled}>
          {COPY.set}
        </Button>
        {isOverridden ? (
          <Button
            size="sm"
            appearance="base"
            onClick={onReset}
            disabled={disabled}
            data-testid={`${testId}-reset`}
          >
            {COPY.reset}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function LargeScreenUpsellQaView({
  wouldShow,
  copyVariant,
  onboardingDisplay,
  pastCooldownLabel,
  gateRows,
  retriesDisplay,
  killThresholdValue,
  lastSeenDisplay,
  isFeatureEnabled,
  personalizedRecommendationsEnabled,
  isModalEnabled,
  nanoModelRows,
  touchscreenModelRows,
  isAdvancedOpen,
  draftKillThreshold,
  draftCooldownDefault,
  draftCooldownNanoS,
  draftCooldownNanoSP,
  draftCooldownNanoX,
  draftCadenceDays,
  canEditFlagParams,
  killThresholdLabel,
  cooldownDefaultLabel,
  cooldownNanoSLabel,
  cooldownNanoSPLabel,
  cooldownNanoXLabel,
  cadenceDaysLabel,
  modalEnabledLabel,
  killThresholdPlaceholder,
  cooldownDefaultPlaceholder,
  cooldownNanoSPlaceholder,
  cooldownNanoSPPlaceholder,
  cooldownNanoXPlaceholder,
  cadenceDaysPlaceholder,
  killThresholdOverridden,
  cooldownDefaultOverridden,
  cooldownNanoSOverridden,
  cooldownNanoSPOverridden,
  cooldownNanoXOverridden,
  cadenceDaysOverridden,
  hasLocalOverride,
  handleBack,
  handleReload,
  handleResetAllFlagParams,
  handleToggleFeature,
  handleTogglePersonalizedRecommendations,
  handleToggleDeviceModel,
  handleToggleAdvanced,
  handleToggleModalEnabled,
  handleSetOnboardingDaysAgo,
  handleSetOnboardingPastCooldown,
  handleClearOnboardingDate,
  handleDecrementRetries,
  handleIncrementRetries,
  handleResetRetries,
  handleSetLastSeenNow,
  handleClearLastSeen,
  setDraftKillThreshold,
  handleApplyKillThreshold,
  handleResetKillThreshold,
  setDraftCooldownDefault,
  handleApplyCooldownDefault,
  handleResetCooldownDefault,
  setDraftCooldownNanoS,
  handleApplyCooldownNanoS,
  handleResetCooldownNanoS,
  setDraftCooldownNanoSP,
  handleApplyCooldownNanoSP,
  handleResetCooldownNanoSP,
  setDraftCooldownNanoX,
  handleApplyCooldownNanoX,
  handleResetCooldownNanoX,
  setDraftCadenceDays,
  handleApplyCadenceDays,
  handleResetCadenceDays,
}: Props) {
  return (
    <Box grow shrink className="p-8 pb-16">
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={handleBack} icon={ArrowLeft}>
            {COPY.back}
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          {COPY.title}
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-20 px-4 md:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
        <aside className="self-start md:sticky md:top-8">
          <section className="rounded-xl bg-surface p-16">
            <p className="body-3 mb-6 text-muted">{COPY.willItShow}</p>
            <p
              className={`heading-2-semi-bold mb-14 ${wouldShow ? "text-success" : "text-error"}`}
              data-testid="large-screen-upsell-qa-would-show"
            >
              {wouldShow ? COPY.yes : COPY.no}
            </p>

            <p className="body-3 mb-6 text-muted">{COPY.gatesTitle}</p>
            <ul className="mb-14 flex flex-col gap-4" data-testid="large-screen-upsell-qa-gates">
              {gateRows.map(gate => (
                <li key={gate.reason} className="body-2 flex items-start gap-6">
                  <span className={gate.passes ? "text-success" : "text-error"} aria-hidden>
                    {gate.passes ? "✓" : "✗"}
                  </span>
                  <span
                    className={
                      gate.passes
                        ? "text-muted"
                        : gate.isBlocking
                          ? "font-medium text-error"
                          : "text-error"
                    }
                  >
                    {gate.label}
                    {gate.isBlocking ? ` ${COPY.blockingNow}` : ""}
                  </span>
                </li>
              ))}
            </ul>

            <p
              className="body-2 mb-14 font-medium text-base"
              data-testid="large-screen-upsell-qa-copy-variant"
            >
              {COPY.copyVariantLabel}: {copyVariant}
            </p>

            <div className="flex flex-col gap-6" data-testid="large-screen-upsell-qa-reload-hint">
              <p className="body-3 text-muted">{COPY.reloadHintLead}</p>
              <p className="body-2 font-medium text-warning">{COPY.reloadHintRestart}</p>
              {wouldShow ? (
                <Button
                  size="sm"
                  appearance="accent"
                  onClick={handleReload}
                  data-testid="large-screen-upsell-qa-reload"
                >
                  {COPY.reload}
                </Button>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="min-w-0 rounded-xl bg-surface p-16">
          <div className="flex flex-col gap-16">
            <p className="heading-4-semi-bold text-base">{COPY.configure}</p>

            <ToggleRow
              name="large-screen-upsell-qa-feature"
              label={COPY.featureOn}
              selected={isFeatureEnabled}
              onChange={handleToggleFeature}
            />

            <ToggleRow
              name="large-screen-upsell-qa-personalized-recommendations"
              label={COPY.personalizedRecommendations}
              selected={personalizedRecommendationsEnabled}
              onChange={handleTogglePersonalizedRecommendations}
              explanation={COPY.personalizedRecommendationsExplain}
            />

            <div className="flex flex-col gap-6">
              <span className="body-2 font-medium text-base">{COPY.seenNanos}</span>
              <div className="flex flex-wrap items-center gap-12">
                {nanoModelRows.map(row => (
                  <div
                    key={row.id}
                    className="flex items-center gap-8"
                    data-testid={`large-screen-upsell-qa-nano-${row.id}`}
                  >
                    <Checkbox
                      name={`large-screen-upsell-qa-nano-${row.id}`}
                      checked={row.checked}
                      onCheckedChange={checked => handleToggleDeviceModel(row.id, checked === true)}
                    />
                    <span className="body-2 text-base">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <span className="body-2 font-medium text-base">{COPY.seenTouchscreens}</span>
              <p className="body-3 text-muted">{COPY.seenTouchscreensHint}</p>
              <div className="flex flex-wrap items-center gap-12">
                {touchscreenModelRows.map(row => (
                  <div
                    key={row.id}
                    className="flex items-center gap-8"
                    data-testid={`large-screen-upsell-qa-touchscreen-${row.id}`}
                  >
                    <Checkbox
                      name={`large-screen-upsell-qa-touchscreen-${row.id}`}
                      checked={row.checked}
                      onCheckedChange={checked => handleToggleDeviceModel(row.id, checked === true)}
                    />
                    <span className="body-2 text-base">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <span className="body-2 font-medium text-base">{COPY.onboardingDate}</span>
              <p className="body-3 text-muted">{COPY.onboardingConfigureHint}</p>
              <p className="body-3 text-muted" data-testid="large-screen-upsell-qa-onboarding">
                {COPY.currentValue(onboardingDisplay)}
              </p>
              <div className="flex flex-wrap gap-8">
                {ONBOARDING_DATE_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    size="sm"
                    appearance="base"
                    onClick={() => handleSetOnboardingDaysAgo(preset.days)}
                    data-testid={`large-screen-upsell-qa-onboarding-${preset.id}`}
                  >
                    {COPY[preset.labelKey]}
                  </Button>
                ))}
                <Button
                  size="sm"
                  appearance="accent"
                  onClick={handleSetOnboardingPastCooldown}
                  data-testid="large-screen-upsell-qa-onboarding-past-cooldown"
                >
                  {pastCooldownLabel}
                </Button>
                <Button
                  size="sm"
                  appearance="transparent"
                  onClick={handleClearOnboardingDate}
                  data-testid="large-screen-upsell-qa-onboarding-clear"
                >
                  {COPY.onboardingClearLegacy}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <span className="body-2 font-medium text-base">{COPY.retriesEdit}</span>
              <p className="body-3 text-muted" data-testid="large-screen-upsell-qa-retries-status">
                {COPY.currentValue(COPY.retriesValue(retriesDisplay, killThresholdValue))}
              </p>
              <div className="flex flex-wrap gap-8">
                <Button
                  size="sm"
                  appearance="base"
                  onClick={handleDecrementRetries}
                  data-testid="large-screen-upsell-qa-retries-decrement"
                >
                  {COPY.retriesDecrement}
                </Button>
                <Button
                  size="sm"
                  appearance="base"
                  onClick={handleIncrementRetries}
                  data-testid="large-screen-upsell-qa-retries-increment"
                >
                  {COPY.retriesIncrement}
                </Button>
                <Button
                  size="sm"
                  appearance="transparent"
                  onClick={handleResetRetries}
                  data-testid="large-screen-upsell-qa-retries-reset"
                >
                  {COPY.reset}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <span className="body-2 font-medium text-base">{COPY.lastSeenLabel}</span>
              <p className="body-3 text-muted">{COPY.lastSeenHint}</p>
              <p
                className="body-3 text-muted"
                data-testid="large-screen-upsell-qa-last-seen-status"
              >
                {COPY.currentValue(lastSeenDisplay)}
              </p>
              <div className="flex flex-wrap gap-8">
                <Button
                  size="sm"
                  appearance="transparent"
                  onClick={handleSetLastSeenNow}
                  data-testid="large-screen-upsell-qa-last-seen-set-now"
                >
                  {COPY.lastSeenSetNow}
                </Button>
                <Button
                  size="sm"
                  appearance="transparent"
                  onClick={handleClearLastSeen}
                  data-testid="large-screen-upsell-qa-last-seen-clear"
                >
                  {COPY.clear}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-muted-subtle pt-14">
            <Button size="sm" appearance="no-background" onClick={handleToggleAdvanced}>
              {isAdvancedOpen ? COPY.hideAdvanced : COPY.advanced}
            </Button>

            {isAdvancedOpen ? (
              <div className="mt-14 flex flex-col gap-16">
                <ToggleRow
                  name="large-screen-upsell-qa-modal-enabled"
                  label={modalEnabledLabel}
                  selected={isModalEnabled}
                  onChange={handleToggleModalEnabled}
                  explanation={COPY.modalEnabledExplain}
                />

                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center justify-between gap-8">
                    <span className="body-2 font-medium text-base">{COPY.flagParamsTitle}</span>
                    {hasLocalOverride ? (
                      <Button
                        size="sm"
                        appearance="base"
                        onClick={handleResetAllFlagParams}
                        data-testid="large-screen-upsell-qa-reset-all-flag-params"
                      >
                        {COPY.resetAllFlagParams}
                      </Button>
                    ) : null}
                  </div>
                  <p className="body-3 text-muted">{COPY.flagParamsHint}</p>
                </div>

                <div className="flex flex-col gap-10">
                  <ParamRow
                    label={killThresholdLabel}
                    value={draftKillThreshold}
                    placeholder={killThresholdPlaceholder}
                    onChange={setDraftKillThreshold}
                    onApply={handleApplyKillThreshold}
                    onReset={handleResetKillThreshold}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-kill-threshold"
                    explanation={COPY.killThresholdExplain}
                    isOverridden={killThresholdOverridden}
                  />
                  <ParamRow
                    label={cooldownDefaultLabel}
                    value={draftCooldownDefault}
                    placeholder={cooldownDefaultPlaceholder}
                    onChange={setDraftCooldownDefault}
                    onApply={handleApplyCooldownDefault}
                    onReset={handleResetCooldownDefault}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-cooldown-default"
                    explanation={COPY.cooldownDefaultExplain}
                    isOverridden={cooldownDefaultOverridden}
                  />
                  <ParamRow
                    label={cooldownNanoSLabel}
                    value={draftCooldownNanoS}
                    placeholder={cooldownNanoSPlaceholder}
                    onChange={setDraftCooldownNanoS}
                    onApply={handleApplyCooldownNanoS}
                    onReset={handleResetCooldownNanoS}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-cooldown-nanos"
                    explanation={COPY.cooldownNanoSExplain}
                    isOverridden={cooldownNanoSOverridden}
                  />
                  <ParamRow
                    label={cooldownNanoSPLabel}
                    value={draftCooldownNanoSP}
                    placeholder={cooldownNanoSPPlaceholder}
                    onChange={setDraftCooldownNanoSP}
                    onApply={handleApplyCooldownNanoSP}
                    onReset={handleResetCooldownNanoSP}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-cooldown-nanosp"
                    explanation={COPY.cooldownNanoSPExplain}
                    isOverridden={cooldownNanoSPOverridden}
                  />
                  <ParamRow
                    label={cooldownNanoXLabel}
                    value={draftCooldownNanoX}
                    placeholder={cooldownNanoXPlaceholder}
                    onChange={setDraftCooldownNanoX}
                    onApply={handleApplyCooldownNanoX}
                    onReset={handleResetCooldownNanoX}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-cooldown-nanox"
                    explanation={COPY.cooldownNanoXExplain}
                    isOverridden={cooldownNanoXOverridden}
                  />
                  <ParamRow
                    label={cadenceDaysLabel}
                    value={draftCadenceDays}
                    placeholder={cadenceDaysPlaceholder}
                    onChange={setDraftCadenceDays}
                    onApply={handleApplyCadenceDays}
                    onReset={handleResetCadenceDays}
                    disabled={!canEditFlagParams}
                    testId="large-screen-upsell-qa-cadence-days"
                    explanation={COPY.cadenceDaysExplain}
                    isOverridden={cadenceDaysOverridden}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </Box>
  );
}
