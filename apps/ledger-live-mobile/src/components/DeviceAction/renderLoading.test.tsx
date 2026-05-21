import React from "react";
import { render, screen } from "@tests/test-renderer";
import { useTranslation } from "~/context/Locale";
import { renderLoading } from "./rendering";

const STUCK_LOADER_HINT_TEXT = "Ensure your device is unlocked and no operation is pending";

function Harness({ showStuckHint }: { showStuckHint: boolean }) {
  const { t } = useTranslation();
  return <>{renderLoading({ t, showStuckHint })}</>;
}

describe("DeviceAction renderLoading - stuck loader hint", () => {
  it("does not show the hint when showStuckHint is false", () => {
    render(<Harness showStuckHint={false} />);
    expect(screen.queryByText(STUCK_LOADER_HINT_TEXT)).toBeNull();
    expect(screen.queryByTestId("device-action-stuck-loader-hint")).toBeNull();
  });

  it("shows the hint when showStuckHint is true", () => {
    render(<Harness showStuckHint={true} />);
    expect(screen.getByTestId("device-action-stuck-loader-hint")).toBeOnTheScreen();
    expect(screen.getByText(STUCK_LOADER_HINT_TEXT)).toBeOnTheScreen();
  });

  it("defaults to no hint when prop is omitted", () => {
    function Bare() {
      const { t } = useTranslation();
      return <>{renderLoading({ t })}</>;
    }
    render(<Bare />);
    expect(screen.queryByTestId("device-action-stuck-loader-hint")).toBeNull();
  });
});
