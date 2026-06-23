import React from "react";
import { render, screen } from "tests/testSetup";
import { useDialogBackgroundTone } from "LLD/hooks/useDialogBackgroundTone";
import type { DialogBackgroundTone } from "LLD/contexts/DialogBackgroundContext";
import { DialogBackgroundToneProvider } from ".";

const statusGradientTones = ["error", "info", "success"] as const;

function BackgroundToneRequester({ tone }: { tone?: DialogBackgroundTone }) {
  useDialogBackgroundTone(tone);

  return <div>Background tone requester</div>;
}

function expectNoStatusGradient() {
  statusGradientTones.forEach(tone => {
    expect(screen.queryByTestId(`dialog-status-gradient-${tone}`)).toBeNull();
  });
}

describe("DialogBackgroundToneProvider", () => {
  it.each(statusGradientTones)(
    "GIVEN a component inside the provider WHEN it requests the %s tone THEN the matching background gradient is displayed",
    tone => {
      // GIVEN / WHEN
      render(
        <DialogBackgroundToneProvider>
          <BackgroundToneRequester tone={tone} />
        </DialogBackgroundToneProvider>,
      );

      // THEN
      expect(screen.getByTestId(`dialog-status-gradient-${tone}`)).toBeVisible();
    },
  );

  it("GIVEN a component inside the provider WHEN it requests an undefined tone THEN no background gradient is displayed", () => {
    // GIVEN / WHEN
    render(
      <DialogBackgroundToneProvider>
        <BackgroundToneRequester tone={undefined} />
      </DialogBackgroundToneProvider>,
    );

    // THEN
    expectNoStatusGradient();
  });

  it("GIVEN a component requested a defined tone WHEN that component unmounts THEN the background gradient is cleared", () => {
    // GIVEN
    const { rerender } = render(
      <DialogBackgroundToneProvider>
        <BackgroundToneRequester tone="success" />
      </DialogBackgroundToneProvider>,
    );
    expect(screen.getByTestId("dialog-status-gradient-success")).toBeVisible();

    // WHEN
    rerender(<DialogBackgroundToneProvider>{null}</DialogBackgroundToneProvider>);

    // THEN
    expectNoStatusGradient();
  });
});
