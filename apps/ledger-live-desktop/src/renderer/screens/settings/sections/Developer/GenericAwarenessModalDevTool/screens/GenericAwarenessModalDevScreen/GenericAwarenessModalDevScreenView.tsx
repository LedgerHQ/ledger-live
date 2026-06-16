import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import Box from "~/renderer/components/Box";
import { DevButtonGroup } from "../../components/DevButtonGroup";
import { DevDeeplinkCopyField } from "../../components/DevDeeplinkCopyField";
import { DevFormCard } from "../../components/DevFormCard";
import { DevLabeledInput } from "../../components/DevLabeledInput";
import { DevLabeledSelect } from "../../components/DevLabeledSelect";
import { DevSavedCardRow } from "../../components/DevSavedCardRow";
import { DevSectionHeader } from "../../components/DevSectionHeader";
import { DevSurfaceSection } from "../../components/DevSurfaceSection";
import { COPY } from "../../utils/copy";
import {
  MAX_FEATURE_INTRO_ITEMS,
  MIN_CAROUSEL_SLIDES,
  MIN_FEATURE_INTRO_ITEMS,
} from "../../utils/defaults";
import type { DevLayoutMode, DevTriggerMode, SelectOption } from "../../utils/types";
import type { GenericAwarenessModalDevScreenViewModel } from "./useGenericAwarenessModalDevScreenViewModel";

const LAYOUT_OPTIONS: SelectOption<DevLayoutMode>[] = [
  { value: "carousel", label: COPY.layoutCarousel },
  { value: "featureIntro", label: COPY.layoutFeatureIntro },
  { value: "prompt", label: COPY.layoutPrompt },
];

const TRIGGER_OPTIONS: SelectOption<DevTriggerMode>[] = [
  { value: "appStart", label: COPY.triggerAppStart },
  { value: "bannerClick", label: COPY.triggerBannerClick },
];

type Props = GenericAwarenessModalDevScreenViewModel;

export function GenericAwarenessModalDevScreenView({
  form,
  campaignId,
  deeplink,
  savedCards,
  slideKeys,
  itemKeys,
  onBack,
  setLayout,
  setTrigger,
  updateForm,
  updateSlide,
  addSlide,
  removeSlide,
  updateItem,
  addItem,
  removeItem,
  onAddToStore,
  onPreview,
  onRemoveAll,
  onLoadSamples,
  onRemoveSavedCard,
  onResetFormDefaults,
}: Readonly<Props>) {
  return (
    <Box grow shrink className="p-8 pb-16">
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={onBack} icon={ArrowLeft}>
            {COPY.back}
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          {COPY.title}
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <Box className="mx-auto flex max-w-3xl flex-col gap-10 px-4">
        <DevSurfaceSection title={COPY.sectionConfiguration} className="pb-24">
          <div className="flex flex-row flex-wrap gap-x-8 gap-y-2">
            <DevLabeledSelect
              hideLabel
              label={COPY.layout}
              value={LAYOUT_OPTIONS.find(o => o.value === form.layout) ?? LAYOUT_OPTIONS[0]}
              options={LAYOUT_OPTIONS}
              onChange={option => setLayout(option.value)}
            />
            <DevLabeledSelect
              hideLabel
              label={COPY.trigger}
              value={TRIGGER_OPTIONS.find(o => o.value === form.trigger) ?? TRIGGER_OPTIONS[0]}
              options={TRIGGER_OPTIONS}
              onChange={option => setTrigger(option.value)}
              className="min-w-[280px]"
            />
          </div>
          <div className="flex flex-col gap-4 border-t border-muted-subtle pt-6">
            <DevLabeledInput
              label={COPY.campaignId}
              value={campaignId}
              readOnly
              onChange={() => {}}
            />
            {form.trigger === "bannerClick" ? <DevDeeplinkCopyField deeplink={deeplink} /> : null}
          </div>
        </DevSurfaceSection>

        {form.layout === "carousel" ? (
          <section className="flex flex-col gap-8">
            <DevSectionHeader
              title={COPY.carouselSlides}
              action={
                <Button size="sm" appearance="accent" onClick={addSlide}>
                  {COPY.addSlide}
                </Button>
              }
            />
            {form.slides.map((slide, index) => (
              <DevFormCard key={slideKeys[index]}>
                <DevSectionHeader
                  title={COPY.slideLabel(index)}
                  action={
                    <Button
                      size="sm"
                      appearance="red"
                      disabled={form.slides.length <= MIN_CAROUSEL_SLIDES}
                      onClick={() => removeSlide(index)}
                    >
                      {COPY.removeSlide}
                    </Button>
                  }
                />
                <DevLabeledInput
                  label={COPY.fields.title}
                  value={slide.title}
                  onChange={title => updateSlide(index, { title })}
                />
                <DevLabeledInput
                  label={COPY.fields.subtitle}
                  value={slide.subtitle}
                  onChange={subtitle => updateSlide(index, { subtitle })}
                />
                <DevLabeledInput
                  label={COPY.fields.imageUrlLight}
                  value={slide.imageUrlLight}
                  onChange={imageUrlLight => updateSlide(index, { imageUrlLight })}
                />
                <DevLabeledInput
                  label={COPY.fields.imageUrlDark}
                  value={slide.imageUrlDark}
                  onChange={imageUrlDark => updateSlide(index, { imageUrlDark })}
                />
                <DevLabeledInput
                  label={COPY.fields.primaryButtonLabel}
                  value={slide.primaryButtonLabel}
                  onChange={primaryButtonLabel => updateSlide(index, { primaryButtonLabel })}
                />
                <DevLabeledInput
                  label={COPY.fields.primaryButtonLink}
                  value={slide.primaryButtonLink}
                  onChange={primaryButtonLink => updateSlide(index, { primaryButtonLink })}
                />
                <DevLabeledInput
                  label={COPY.fields.navigationButtonLabel}
                  value={slide.navigationButtonLabel}
                  onChange={navigationButtonLabel => updateSlide(index, { navigationButtonLabel })}
                />
              </DevFormCard>
            ))}
          </section>
        ) : (
          <section className="flex flex-col gap-8">
            <DevSectionHeader
              title={form.layout === "prompt" ? COPY.promptMain : COPY.featureIntroMain}
            />
            <DevLabeledInput
              label={COPY.fields.title}
              value={form.title}
              onChange={title => updateForm({ title })}
            />
            <DevLabeledInput
              label={COPY.fields.subtitle}
              value={form.subtitle}
              onChange={subtitle => updateForm({ subtitle })}
            />
            <DevLabeledInput
              label={COPY.fields.imageUrlLight}
              value={form.imageUrlLight}
              onChange={imageUrlLight => updateForm({ imageUrlLight })}
            />
            <DevLabeledInput
              label={COPY.fields.imageUrlDark}
              value={form.imageUrlDark}
              onChange={imageUrlDark => updateForm({ imageUrlDark })}
            />
            <DevLabeledInput
              label={COPY.fields.primaryButtonLabel}
              value={form.primaryButtonLabel}
              onChange={primaryButtonLabel => updateForm({ primaryButtonLabel })}
            />
            <DevLabeledInput
              label={COPY.fields.primaryButtonLink}
              value={form.primaryButtonLink}
              onChange={primaryButtonLink => updateForm({ primaryButtonLink })}
            />
            <DevLabeledInput
              label={COPY.fields.secondaryButtonLabel}
              value={form.secondaryButtonLabel}
              onChange={secondaryButtonLabel => updateForm({ secondaryButtonLabel })}
            />
            <DevLabeledInput
              label={COPY.fields.secondaryButtonLink}
              value={form.secondaryButtonLink}
              onChange={secondaryButtonLink => updateForm({ secondaryButtonLink })}
            />

            {form.layout === "featureIntro" ? (
              <>
                <DevSectionHeader
                  title={COPY.featureIntroItems}
                  action={
                    <Button
                      size="sm"
                      appearance="accent"
                      disabled={form.items.length >= MAX_FEATURE_INTRO_ITEMS}
                      onClick={addItem}
                    >
                      {COPY.addItem}
                    </Button>
                  }
                />
                {form.items.map((item, index) => (
                  <DevFormCard key={itemKeys[index]}>
                    <DevSectionHeader
                      title={COPY.itemLabel(index)}
                      action={
                        <Button
                          size="sm"
                          appearance="red"
                          disabled={form.items.length <= MIN_FEATURE_INTRO_ITEMS}
                          onClick={() => removeItem(index)}
                        >
                          {COPY.removeItem}
                        </Button>
                      }
                    />
                    <DevLabeledInput
                      label={COPY.fields.icon}
                      value={item.icon}
                      onChange={icon => updateItem(index, { icon })}
                    />
                    <DevLabeledInput
                      label={COPY.fields.title}
                      value={item.title}
                      onChange={title => updateItem(index, { title })}
                    />
                    <DevLabeledInput
                      label={COPY.fields.subtitle}
                      value={item.subtitle}
                      onChange={subtitle => updateItem(index, { subtitle })}
                    />
                  </DevFormCard>
                ))}
              </>
            ) : null}
          </section>
        )}

        <section className="flex flex-col gap-4 py-24">
          <h2 className="body-2-semi-bold text-muted">{COPY.sectionActions}</h2>
          <DevButtonGroup>
            <Button size="sm" appearance="accent" onClick={onAddToStore}>
              {COPY.addToStore}
            </Button>
            <Button size="sm" appearance="accent" onClick={onPreview}>
              {COPY.preview}
            </Button>
            <Button size="sm" appearance="gray" onClick={onResetFormDefaults}>
              {COPY.resetForm}
            </Button>
            <Button size="sm" appearance="gray" onClick={onLoadSamples}>
              {COPY.loadSamples}
            </Button>
          </DevButtonGroup>
        </section>

        <section className="flex flex-col gap-6">
          <DevSectionHeader title={COPY.sectionSavedCards} />
          {savedCards.length === 0 ? (
            <p className="body-2 leading-relaxed text-muted">{COPY.noSavedCards}</p>
          ) : (
            <ul className="flex flex-col gap-8">
              {savedCards.map(card => (
                <DevSavedCardRow
                  key={card.id}
                  id={card.id}
                  layout={card.layout}
                  onRemove={() => onRemoveSavedCard(card.id)}
                />
              ))}
            </ul>
          )}
          <DevButtonGroup className="border-t border-muted-subtle pt-6">
            <Button size="sm" appearance="red" onClick={onRemoveAll}>
              {COPY.removeAll}
            </Button>
          </DevButtonGroup>
        </section>
      </Box>
    </Box>
  );
}
