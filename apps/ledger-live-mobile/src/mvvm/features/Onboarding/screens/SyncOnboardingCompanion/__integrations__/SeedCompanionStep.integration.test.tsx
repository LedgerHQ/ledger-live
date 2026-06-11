import React from "react";
import { Linking } from "react-native";
import { CharonStatus } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import SeedCompanionStep from "../components/SeedCompanionStep";

const mockTrack = jest.fn();
jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    useTrack: () => mockTrack,
  };
});

const baseProps = {
  productName: "Ledger Stax",
  device: {
    deviceId: "mock_stax",
    deviceName: "Mock Stax",
    modelId: DeviceModelId.stax,
    wired: false,
  },
};

describe("SeedCompanionStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("renders the new seed branch", async () => {
    render(<SeedCompanionStep {...baseProps} seedPathStatus="new_seed" />);

    expect(await screen.findByText("Secret Recovery Phrase")).toBeVisible();
    expect(
      await screen.findByText(
        /Your Secret Recovery Phrase controls your assets and is irreplaceable/,
      ),
    ).toBeVisible();
  });

  it("renders the restore choice branch including Ledger Recovery Key when supported", async () => {
    render(
      <SeedCompanionStep
        {...baseProps}
        seedPathStatus="choice_restore_direct_or_recover"
        charonSupported
      />,
    );

    expect(await screen.findByText("Ledger Recovery Key")).toBeVisible();
    expect(await screen.findByText("Ledger Recover subscription")).toBeVisible();
  });

  it("hides the Ledger Recovery Key option when charon is unsupported", async () => {
    render(
      <SeedCompanionStep
        {...baseProps}
        seedPathStatus="choice_restore_direct_or_recover"
        charonSupported={false}
      />,
    );

    expect(await screen.findByText("Ledger Recover subscription")).toBeVisible();
    expect(screen.queryByText("Ledger Recovery Key")).not.toBeOnTheScreen();
  });

  it("opens the Learn More link and tracks the click on the backup_charon branch", async () => {
    const { user } = render(
      <SeedCompanionStep
        {...baseProps}
        seedPathStatus="backup_charon"
        charonStatus={CharonStatus.Choice}
      />,
    );

    const learnMore = await screen.findByText("Learn more or buy");
    await user.press(learnMore);

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
      flow: "onboarding",
    });
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://shop.ledger.com/products/ledger-recovery-key",
    );
  });
});
