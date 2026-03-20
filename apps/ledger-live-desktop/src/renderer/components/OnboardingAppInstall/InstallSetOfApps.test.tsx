import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SkipReason } from "@ledgerhq/live-common/apps/types";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import { createConnectAppMock } from "tests/mocks/createConnectAppMock";
import InstallSetOfApps from "./InstallSetOfApps";

const testDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoX,
  wired: false,
};
const installQueue = ["Ethereum", "Bitcoin"];
const activeEthereumInstall = { type: "install" as const, name: "Ethereum" };

describe("InstallSetOfApps", () => {
  const createProps = () => ({
    device: testDevice,
    dependencies: installQueue,
    setHeaderLoader: jest.fn(),
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  });

  const renderInstallSetOfApps = () => {
    const props = createProps();
    const connectAppMock = createConnectAppMock();

    render(<InstallSetOfApps {...props} actionDependencyInjection={connectAppMock.action} />);

    const beginInlineInstall = async () => {
      await connectAppMock.emit(events => {
        events.listingApps();
        events.listedApps(installQueue);
        events.inlineInstall({
          progress: 0,
          currentAppOp: activeEthereumInstall,
          installQueue,
        });
      });
    };

    const updateInlineInstall = async (progress: number) => {
      await connectAppMock.emit(events => {
        events.inlineInstall({
          progress,
          currentAppOp: activeEthereumInstall,
          installQueue,
        });
      });
    };

    return { props, connectAppMock, beginInlineInstall, updateInlineInstall };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the active app with a determinate loader while inline install is in progress", async () => {
    const { props, beginInlineInstall, updateInlineInstall } = renderInstallSetOfApps();

    await beginInlineInstall();
    await updateInlineInstall(0.35);

    expect(screen.getByTestId("installing-text")).toHaveTextContent(
      "Stay in Ledger Wallet while apps are installing.",
    );
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin app")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("app-install-item-progress-loader")).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId("app-install-item-infinite-loader")).toHaveLength(0);
    expect(props.onComplete).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(props.onError).not.toHaveBeenCalled();
  });

  it("switches from infinite loader to determinate loader before completing", async () => {
    const { props, connectAppMock, beginInlineInstall, updateInlineInstall } =
      renderInstallSetOfApps();

    await beginInlineInstall();

    const infiniteLoader = await screen.findByTestId("app-install-item-infinite-loader");
    expect(infiniteLoader).toBeInTheDocument();
    expect(props.onComplete).not.toHaveBeenCalled();

    await updateInlineInstall(0.35);

    const determinateLoader = await screen.findByTestId("app-install-item-progress-loader");
    expect(determinateLoader).toBeInTheDocument();
    expect(infiniteLoader).not.toBeInTheDocument();

    await connectAppMock.events.opened();

    await waitFor(() => {
      expect(determinateLoader).not.toBeInTheDocument();
    });
    expect(props.onComplete).toHaveBeenCalled();
  });

  it("shows a skipped-apps alert when a dependency is unavailable on the provider", async () => {
    const { connectAppMock } = renderInstallSetOfApps();

    await connectAppMock.emit(events => {
      events.listingApps();
      events.someAppsSkipped([
        {
          appOp: activeEthereumInstall,
          reason: SkipReason.NoSuchAppOnProvider,
        },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Some apps aren’t available.*Ledger Nano X/)).toBeInTheDocument();
    });
  });

  it("forwards allow-manager refusal to onCancel without reporting a generic error", async () => {
    const { props, connectAppMock } = renderInstallSetOfApps();

    await connectAppMock.error(new UserRefusedAllowManager());

    await waitFor(() => {
      expect(props.onCancel).toHaveBeenCalled();
    });
    expect(props.onError).not.toHaveBeenCalled();
  });

  it("forwards non-allow-manager errors to onError without cancelling the flow", async () => {
    const { props, connectAppMock } = renderInstallSetOfApps();
    const err = new Error("install failed");

    await connectAppMock.error(err);

    await waitFor(() => {
      expect(props.onError).toHaveBeenCalledWith(err);
    });
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("hides the parent header loader during inline install", async () => {
    const { props, updateInlineInstall } = renderInstallSetOfApps();

    await updateInlineInstall(0.2);

    await waitFor(() => {
      expect(props.setHeaderLoader).toHaveBeenLastCalledWith(false);
    });
  });
});
