import React from "react";
import { render, screen } from "tests/testSetup";
import CantonDisclaimer from "../CantonDisclaimer";

describe("CantonDisclaimer Integration", () => {
  it("disables Agree until the consent row is clicked, then enables it", async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();

    const { user } = render(<CantonDisclaimer onAgree={onAgree} onCancel={onCancel} />);

    const agreeBtn = screen.getByRole("button", { name: /agree/i });
    expect(agreeBtn).toBeDisabled();

    await user.click(screen.getByTestId("canton-disclaimer-agree-row"));

    expect(agreeBtn).not.toBeDisabled();

    await user.click(agreeBtn);
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel without ticking the checkbox", async () => {
    const onAgree = jest.fn();
    const onCancel = jest.fn();

    const { user } = render(<CantonDisclaimer onAgree={onAgree} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onAgree).not.toHaveBeenCalled();
  });

  it("toggles consent exactly once when the checkbox itself is clicked (no double-toggle from row bubbling)", async () => {
    const { user } = render(<CantonDisclaimer onAgree={jest.fn()} onCancel={jest.fn()} />);

    // Click the visual checkbox itself (not the row label area) to verify the
    // CheckBox component's internal stopPropagation prevents the row's onClick
    // from firing a second toggle. We deliberately reach into the row's first
    // child here because the goal of this test is to exercise the inner control,
    // not the row-as-label UX path covered by the test above. (The shared
    // CheckBox primitive doesn't expose role="checkbox" or aria-label,
    // so we can't query it via getByRole
    const checkboxBase = screen.getByTestId("canton-disclaimer-agree-row")
      .firstElementChild as HTMLElement;
    expect(checkboxBase).not.toBeNull();

    await user.click(checkboxBase);
    expect(screen.getByRole("button", { name: /agree/i })).not.toBeDisabled();

    // Click again → toggle off.
    await user.click(checkboxBase);
    expect(screen.getByRole("button", { name: /agree/i })).toBeDisabled();
  });

  it("opens the Canton Terms modal when the link in the consent label is clicked, without toggling the checkbox", async () => {
    const { user, store } = render(<CantonDisclaimer onAgree={jest.fn()} onCancel={jest.fn()} />);

    await user.click(screen.getByTestId("canton-disclaimer-terms-link"));

    expect(store.getState().modals.MODAL_CANTON_TERMS?.isOpened).toBe(true);
    // Clicking the link must not toggle the consent checkbox.
    expect(screen.getByRole("button", { name: /agree/i })).toBeDisabled();
  });
});
