import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SkipReason } from "@ledgerhq/live-common/apps/types";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import InstallSetOfApps from "./InstallSetOfApps";

function expectDeterminateProgressSvg(container: HTMLElement) {
  expect(container.querySelectorAll("svg circle")).toHaveLength(2);
}

const mockUseHook = jest.fn();

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({
    useHook: (...args: unknown[]) => mockUseHook(...args),
  }),
}));

jest.mock("./AllowManagerModal", () => ({
  __esModule: true,
  default: () => null,
}));

const testDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoX,
  wired: false,
};

type MockInstallHookStatus = {
  skippedAppOps: { appOp: { name: string }; reason: SkipReason }[];
  installQueue: string[];
  listedApps: boolean;
  error: Error | null;
  currentAppOp: { name: string } | null;
  progress: number | null;
  opened: boolean;
  allowManagerGranted: boolean;
  isLoading: boolean;
};

function createHookStatus(over: Partial<MockInstallHookStatus> = {}): MockInstallHookStatus {
  return {
    skippedAppOps: [],
    installQueue: ["Ethereum", "Bitcoin"],
    listedApps: true,
    error: null,
    currentAppOp: { name: "Ethereum" },
    progress: 0.35,
    opened: false,
    allowManagerGranted: true,
    isLoading: false,
    ...over,
  };
}

describe("InstallSetOfApps", () => {
  const defaultProps = {
    device: testDevice,
    dependencies: ["Ethereum", "Bitcoin"],
    setHeaderLoader: jest.fn(),
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHook.mockReturnValue(createHookStatus());
  });

  it("renders progress copy and one progress loader for the active app", () => {
    const { container } = render(<InstallSetOfApps {...defaultProps} />);

    expect(
      screen.getByTestId("installing-text"),
    ).toHaveTextContent(
      "Stay in Ledger Wallet while apps are installing.",
    );
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin app")).toBeInTheDocument();
    expectDeterminateProgressSvg(container);
    expect(
      screen.queryAllByTestId("app-install-item-infinite-loader"),
    ).toHaveLength(0);
  });

  it("shows infinite loader for active app when progress is 0", () => {
    mockUseHook.mockReturnValue(
      createHookStatus({ progress: 0, currentAppOp: { name: "Ethereum" } }),
    );
    render(<InstallSetOfApps {...defaultProps} />);

    expect(
      screen.getByTestId("app-install-item-infinite-loader"),
    ).toBeInTheDocument();
  });

  it("calls onComplete when installation is opened (done)", () => {
    mockUseHook.mockReturnValue(createHookStatus({ opened: true }));
    render(<InstallSetOfApps {...defaultProps} />);

    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it("shows skipped-apps alert when a dependency is missing on provider", () => {
    mockUseHook.mockReturnValue(
      createHookStatus({
        skippedAppOps: [
          {
            appOp: { name: "Ethereum" },
            reason: SkipReason.NoSuchAppOnProvider,
          },
        ],
      }),
    );
    render(<InstallSetOfApps {...defaultProps} />);

    expect(
      screen.getByText(/Some apps aren’t available.*Ledger Nano X/),
    ).toBeInTheDocument();
  });

  it("calls onCancel when user refuses allow manager", async () => {
    mockUseHook.mockReturnValue(
      createHookStatus({
        error: new UserRefusedAllowManager(),
        allowManagerGranted: false,
      }),
    );
    render(<InstallSetOfApps {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  it("calls onError for non-allow-manager errors", async () => {
    const err = new Error("install failed");
    mockUseHook.mockReturnValue(
      createHookStatus({
        error: err,
        allowManagerGranted: false,
      }),
    );
    render(<InstallSetOfApps {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith(err);
    });
  });

  it("toggles header loader off while installing inline", () => {
    mockUseHook.mockReturnValue(
      createHookStatus({
        progress: 0.2,
        currentAppOp: { name: "Ethereum" },
        opened: false,
      }),
    );
    render(<InstallSetOfApps {...defaultProps} />);

    expect(defaultProps.setHeaderLoader).toHaveBeenCalledWith(false);
  });
});
