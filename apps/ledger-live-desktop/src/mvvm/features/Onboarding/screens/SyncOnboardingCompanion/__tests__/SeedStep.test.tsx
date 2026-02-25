import React from "react";
import { render, screen } from "tests/testSetup";
import { Flex } from "@ledgerhq/react-ui/index";
import SeedStep from "../components/SeedStep";
import { CharonStatus } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { trackPage, track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";

jest.mock("~/renderer/linking", () => ({
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
}));

const mockDeviceName = "Stax";
const mockDeviceIcon = () => <Flex />;

describe("SeedStep", () => {
  beforeEach(() => {
    jest.mocked(trackPage).mockReset();
    jest.mocked(track).mockReset();
    jest.mocked(openURL).mockReset();
  });

  it("should show new seed step", () => {
    render(
      <SeedStep
        deviceName={mockDeviceName}
        seedPathStatus="new_seed"
        deviceIcon={mockDeviceIcon}
        charonSupported={true}
        charonStatus={null}
      />,
    );

    const step = screen.getByTestId("new-seed-step");

    expect(step).toBeVisible();

    expect(trackPage).not.toHaveBeenCalled();
  });

  describe("should show choice restore or recover step", () => {
    it("should show charon", () => {
      render(
        <SeedStep
          deviceName={mockDeviceName}
          seedPathStatus="choice_restore_direct_or_recover"
          deviceIcon={mockDeviceIcon}
          charonSupported={true}
          charonStatus={null}
        />,
      );

      const step = screen.getByTestId("choice-restore-recover-step");

      expect(step).toBeVisible();

      const charon = screen.queryByTestId("choice-restore-recover-charon");
      expect(charon).toBeVisible();

      expect(trackPage).not.toHaveBeenCalled();
    });

    it("should not show charon", () => {
      render(
        <SeedStep
          deviceName={mockDeviceName}
          seedPathStatus="choice_restore_direct_or_recover"
          deviceIcon={mockDeviceIcon}
          charonSupported={false}
          charonStatus={null}
        />,
      );

      const step = screen.getByTestId("choice-restore-recover-step");

      expect(step).toBeVisible();

      const charon = screen.queryByTestId("choice-restore-recover-charon");
      expect(charon).toBeNull();

      expect(trackPage).not.toHaveBeenCalled();
    });
  });

  it("should show restore seed step", () => {
    render(
      <SeedStep
        deviceName={mockDeviceName}
        seedPathStatus="restore_seed"
        deviceIcon={mockDeviceIcon}
        charonSupported={true}
        charonStatus={null}
      />,
    );

    const step = screen.getByTestId("restore-seed-step");

    expect(step).toBeVisible();

    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should show recover seed step", () => {
    render(
      <SeedStep
        deviceName={mockDeviceName}
        seedPathStatus="recover_seed"
        deviceIcon={mockDeviceIcon}
        charonSupported={true}
        charonStatus={null}
      />,
    );

    const step = screen.getByTestId("recover-seed-step");

    expect(step).toBeVisible();

    expect(trackPage).not.toHaveBeenCalled();
  });

  describe("backup charon step", () => {
    [CharonStatus.Choice, CharonStatus.Rejected, CharonStatus.Ready].forEach(option =>
      it(`should show step and track option ${option}`, () => {
        render(
          <SeedStep
            deviceName={mockDeviceName}
            seedPathStatus="backup_charon"
            deviceIcon={mockDeviceIcon}
            charonSupported={true}
            charonStatus={option}
          />,
        );

        const step = screen.getByTestId("backup-charon-step");

        expect(step).toBeVisible();

        expect(trackPage).toHaveBeenCalled();
      }),
    );

    it("should show step and not track", () => {
      render(
        <SeedStep
          deviceName={mockDeviceName}
          seedPathStatus="backup_charon"
          deviceIcon={mockDeviceIcon}
          charonSupported={true}
          charonStatus={CharonStatus.Running}
        />,
      );

      const step = screen.getByTestId("backup-charon-step");

      expect(step).toBeVisible();

      expect(trackPage).not.toHaveBeenCalled();
    });

    it("should open help link when clicked", async () => {
      const { user } = render(
        <SeedStep
          deviceName={mockDeviceName}
          seedPathStatus="backup_charon"
          deviceIcon={mockDeviceIcon}
          charonSupported={true}
          charonStatus={CharonStatus.Running}
        />,
      );

      const helpLink = screen.getByTestId("learn-more-link");

      expect(helpLink).toBeVisible();

      await user.click(helpLink);

      expect(openURL).toHaveBeenCalledWith("https://shop.ledger.com/products/ledger-recovery-key");
      expect(track).toHaveBeenCalled();
      expect(trackPage).not.toHaveBeenCalled();
    });
  });

  it("should show restore charon step", () => {
    render(
      <SeedStep
        deviceName={mockDeviceName}
        seedPathStatus="restore_charon"
        deviceIcon={mockDeviceIcon}
        charonSupported={true}
        charonStatus={null}
      />,
    );

    const step = screen.getByTestId("restore-charon-step");

    expect(step).toBeVisible();

    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should show selection step", () => {
    render(
      <SeedStep
        deviceName={mockDeviceName}
        seedPathStatus="choice_new_or_restore"
        deviceIcon={mockDeviceIcon}
        charonSupported={true}
        charonStatus={null}
      />,
    );

    const step = screen.getByTestId("selection-step");

    expect(step).toBeVisible();

    expect(trackPage).not.toHaveBeenCalled();
  });
});
