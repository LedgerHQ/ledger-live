import React from "react";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { PageIndicator } from "@ledgerhq/lumen-ui-rnative";
import { render, screen } from "@tests/test-renderer";
import {
  buildDefaultGenericAwarenessModalFormValues,
  type GenericAwarenessModalDebugFormValues,
} from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import {
  GenericAwarenessModalFormContent,
  getGenericAwarenessModalFormTitleKey,
} from "./GenericAwarenessModalFormContent";

const noop = () => {};
const renderForm = (form: GenericAwarenessModalDebugFormValues) =>
  render(
    <GenericAwarenessModalFormContent
      form={form}
      maxFeatureIntroItems={3}
      onCreate={noop}
      onCopyPreview={noop}
      onChangeField={noop}
      onChangeTrigger={noop}
      onAddItem={noop}
      onRemoveItem={noop}
      onChangeItem={noop}
    />,
  );

describe("GenericAwarenessModalFormContent", () => {
  it("maps each layout to the matching title key", () => {
    expect(getGenericAwarenessModalFormTitleKey(GenericAwarenessModalLayout.Carousel)).toBe(
      "settings.debug.contentCards.genericAwareness.createCarousel",
    );
    expect(getGenericAwarenessModalFormTitleKey(GenericAwarenessModalLayout.Prompt)).toBe(
      "settings.debug.contentCards.genericAwareness.createPrompt",
    );
    expect(getGenericAwarenessModalFormTitleKey(GenericAwarenessModalLayout.FeatureIntro)).toBe(
      "settings.debug.contentCards.genericAwareness.createFeatureIntro",
    );
  });

  it("renders prompt fields without item controls", () => {
    renderForm({
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.Prompt,
      title: "Secure your recovery phrase",
      subtitle: "Keep it offline.",
      primaryButtonLabel: "Review",
    });

    expect(screen.getAllByText("Secure your recovery phrase").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Keep it offline.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Review").length).toBeGreaterThan(0);
    expect(screen.queryByText("Slide")).not.toBeOnTheScreen();
  });

  it("renders carousel item preview and page indicator", () => {
    renderForm({
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.Carousel,
      items: [
        {
          title: "First slide",
          subtitle: "First subtitle",
          imageUrlLight: "https://example.com/first.png",
          imageUrlDark: "",
          primaryButtonLabel: "Open",
          primaryButtonLink: "ledgerlive://portfolio",
        },
        {
          title: "Second slide",
          subtitle: "Second subtitle",
          imageUrlLight: "",
          imageUrlDark: "",
          primaryButtonLabel: "Next",
          primaryButtonLink: "ledgerlive://myledger",
        },
      ],
    });

    expect(screen.getAllByText("First slide").length).toBeGreaterThan(0);
    expect(screen.getAllByText("First subtitle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.UNSAFE_getByType(PageIndicator).props).toMatchObject({
      currentPage: 1,
      totalPages: 2,
    });
    expect(screen.getByText("Slide 1")).toBeOnTheScreen();
    expect(screen.getByText("Slide 2")).toBeOnTheScreen();
  });

  it("renders feature intro items in the preview", () => {
    renderForm({
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.FeatureIntro,
      title: "What is new",
      items: [
        {
          title: "Better tracking",
          subtitle: "",
          imageUrlLight: "",
          imageUrlDark: "",
          primaryButtonLabel: "",
          primaryButtonLink: "",
        },
      ],
    });

    expect(screen.getAllByText("What is new").length).toBeGreaterThan(0);
    expect(screen.getByText("• Better tracking")).toBeOnTheScreen();
    expect(screen.getByText("Item 1")).toBeOnTheScreen();
    expect(screen.getByText("Add Item")).toBeOnTheScreen();
  });
});
