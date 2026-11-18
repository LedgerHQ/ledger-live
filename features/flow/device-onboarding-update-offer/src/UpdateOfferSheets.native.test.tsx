import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import { UpdateOfferSheets } from "./UpdateOfferSheets";
import type { UpdateOfferSheetsProps } from "./UpdateOfferSheets.types";
import { updateOfferTestIds } from "./internals";

const COPY = {
  en: {
    translation: {
      "deviceOnboarding.setup.updateOffer.title": "Update OS to unlock full functionality",
      "deviceOnboarding.setup.updateOffer.versions": "OS {{current}} → OS {{available}}",
      "deviceOnboarding.setup.updateOffer.description": "Get the latest features.",
      "deviceOnboarding.setup.updateOffer.updateCta": "Update Ledger OS",
      "deviceOnboarding.setup.updateOffer.skip.title": "Skip this update?",
      "deviceOnboarding.setup.updateOffer.skip.description": "You'll miss the latest fixes.",
      "deviceOnboarding.setup.updateOffer.skip.updateCta": "Update now",
      "deviceOnboarding.setup.updateOffer.skip.skipCta": "Skip anyway",
    },
  },
};

const offered = { current: "2.1.0", available: "5.4.3" };

function renderSheets(props: Partial<UpdateOfferSheetsProps> = {}) {
  const onUpdate = jest.fn();
  const onSkip = jest.fn();
  const allProps: UpdateOfferSheetsProps = {
    update: offered,
    confirmSkip: false,
    suspendSheets: false,
    onUpdate,
    onSkip,
    ...props,
  };
  const view = render(
    <I18nTestProvider resources={COPY}>
      <UpdateOfferSheets {...allProps} />
    </I18nTestProvider>,
  );
  const rerender = (next: Partial<UpdateOfferSheetsProps>) =>
    view.rerender(
      <I18nTestProvider resources={COPY}>
        <UpdateOfferSheets {...allProps} {...next} />
      </I18nTestProvider>,
    );

  return { onUpdate, onSkip, rerender, user: userEvent.setup() };
}

function expanded(testID: string) {
  return screen.getByTestId(testID).props.accessibilityState?.expanded;
}

const closeOffer = `${updateOfferTestIds.offerSheet}-header-close`;
const closeSkip = `${updateOfferTestIds.skipSheet}-header-close`;
const swipeSkip = `${updateOfferTestIds.skipSheet}-dismiss`;

describe("UpdateOfferSheets", () => {
  it("should offer the update with both OS versions", () => {
    renderSheets();

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(true);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
    expect(screen.getByText("Update OS to unlock full functionality")).toBeTruthy();
    expect(screen.getByText(/OS 2\.1\.0 → OS 5\.4\.3/)).toBeTruthy();
  });

  it("should start the update from the offer", async () => {
    const { user, onUpdate, onSkip } = renderSheets();

    await user.press(screen.getByTestId(updateOfferTestIds.offerUpdate));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should ask to confirm the skip when the offer is closed", async () => {
    const { user, onSkip } = renderSheets();

    await user.press(screen.getByTestId(closeOffer));

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(true);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should start the update again from the skip confirmation", async () => {
    const { user, onUpdate, onSkip } = renderSheets();

    await user.press(screen.getByTestId(closeOffer));
    await user.press(screen.getByTestId(updateOfferTestIds.skipUpdate));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
  });

  it.each([
    ["Skip anyway", updateOfferTestIds.skipConfirm],
    ["the close button", closeSkip],
    ["a swipe down", swipeSkip],
  ])("should skip the update with %s", async (_, testID) => {
    const { user, onUpdate, onSkip } = renderSheets();

    await user.press(screen.getByTestId(closeOffer));
    await user.press(screen.getByTestId(testID));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("should open on the skip confirmation after the release notes closed", () => {
    renderSheets({ confirmSkip: true });

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(true);
  });

  it("should not skip when the confirmation hides behind another sheet", async () => {
    const { user, rerender, onSkip } = renderSheets();

    await user.press(screen.getByTestId(closeOffer));
    rerender({ suspendSheets: true });

    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
    expect(screen.queryByTestId(swipeSkip)).toBeNull();
    expect(onSkip).not.toHaveBeenCalled();

    rerender({ suspendSheets: false });
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(true);
  });

  it("should offer the update again once a new offer comes in", async () => {
    const { user, rerender } = renderSheets();

    await user.press(screen.getByTestId(closeOffer));
    rerender({ update: null });
    rerender({ update: offered });

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(true);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
  });

  it("should keep both sheets closed without an offer", () => {
    renderSheets({ update: null });

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
  });
});
