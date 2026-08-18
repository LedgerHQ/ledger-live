import React from "react";
import { Route, Routes } from "react-router";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { isModalOpened } from "~/renderer/reducers/modals";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { useRecoverEntry } from "LLD/hooks/useRecoverEntry";
import { ContextMenu } from "LLD/features/MyWallet/components/ContextMenu";
import { RecoverRouteGuard } from "../RecoverRouteGuard";
import {
  RECOVER_TRIGGER_CTA_BUTTON,
  RECOVER_TRIGGER_DISMISS_BUTTON,
  RECOVER_TRIGGER_PAGE_NAME,
} from "../analytics";

// `~/renderer/linking` `openURL`: Learn more opens the shop URL.
// Tests assert the argument. No browser.
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

// `~/renderer/store`: ContextMenu calls `getStoreValue` / `setStoreValue`.
// Jest has no Electron store.
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

function renderRecoverLns({
  devicesModelList,
  openRecoverFromSidebar = true,
  recoverEnabled = true,
  backupHub = false,
  initialRoute,
}: {
  devicesModelList: DeviceModelId[];
  openRecoverFromSidebar?: boolean;
  recoverEnabled?: boolean;
  backupHub?: boolean;
  initialRoute?: string;
}) {
  function RecoverLnsApp() {
    const { openRecover } = useRecoverEntry();

    return (
      <>
        {backupHub ? (
          <ContextMenu />
        ) : (
          <button type="button" onClick={openRecover}>
            Open Recover
          </button>
        )}
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/accounts" element={<div>accounts</div>} />
          <Route
            path="/recover/:appId"
            element={
              <RecoverRouteGuard>
                <div>recover player</div>
              </RecoverRouteGuard>
            }
          />
        </Routes>
      </>
    );
  }

  return render(<RecoverLnsApp />, {
    ...(initialRoute ? { initialRoute } : {}),
    initialState: {
      ...withFlagOverrides({
        protectServicesDesktop: {
          enabled: recoverEnabled,
          params: {
            protectId: "protect-id",
            openRecoverFromSidebar,
            account: { homeURI: "ledgerlive://recover/protect-id" },
          },
        },
        ...(backupHub ? { lwdBackupHub: { enabled: true } } : {}),
      }),
      settings: { devicesModelList, sharePersonalizedRecommandations: false },
    },
  });
}

async function expectLnsUpsellVisible() {
  await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
  expect(screen.getByText("Want peace-of-mind recovery?")).toBeVisible();
}

describe("Recover LNS block", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show the upsell modal and not mount Recover when a nanoS-only wallet hits /recover/:appId", async () => {
    renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      initialRoute: "/recover/protect-id",
    });

    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(screen.queryByText("home")).not.toBeInTheDocument();
    await expectLnsUpsellVisible();
  });

  it("should return to the previous route when the upsell is dismissed", async () => {
    const { user } = renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      initialRoute: "/accounts",
    });

    await user.click(screen.getByRole("button", { name: "Open Recover" }));
    await expectLnsUpsellVisible();
    await user.click(screen.getByRole("button", { name: "Not now" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("accounts")).toBeVisible();
    expect(screen.queryByText("home")).not.toBeInTheDocument();
    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: RECOVER_TRIGGER_DISMISS_BUTTON.notNow,
        page: RECOVER_TRIGGER_PAGE_NAME,
      }),
    );
  });

  it("should return to the previous route after Learn more opens the shop", async () => {
    const { user } = renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      initialRoute: "/accounts",
    });

    await user.click(screen.getByRole("button", { name: "Open Recover" }));
    await expectLnsUpsellVisible();
    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(openURL).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("accounts")).toBeVisible();
    expect(screen.queryByText("home")).not.toBeInTheDocument();
    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: RECOVER_TRIGGER_CTA_BUTTON,
        page: RECOVER_TRIGGER_PAGE_NAME,
      }),
    );
  });

  it("should leave accounts after Learn more from Backup Hub Recover, without remounting Recover", async () => {
    const { user } = renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      backupHub: true,
      initialRoute: "/accounts",
    });

    await user.click(screen.getByRole("button", { name: "My Wallet" }));
    await user.click(await screen.findByTestId("my-wallet-action-recover"));
    await screen.findByTestId("backup-hub");
    await user.click(screen.getByRole("button", { name: "Discover" }));
    await expectLnsUpsellVisible();
    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(openURL).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("accounts")).toBeVisible();
    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should mount Recover when a Recover-capable device has been seen", () => {
    renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS, DeviceModelId.nanoSP],
      initialRoute: "/recover/protect-id",
    });

    expect(screen.getByText("recover player")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should mount Recover when Recover is disabled even for a nanoS-only wallet", () => {
    renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      recoverEnabled: false,
      initialRoute: "/recover/protect-id",
    });

    expect(screen.getByText("recover player")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should send a nanoS-only wallet to the Recover route instead of Protect Discover", async () => {
    const { user, store } = renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS],
      openRecoverFromSidebar: false,
    });

    await user.click(screen.getByRole("button", { name: "Open Recover" }));

    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(isModalOpened(store.getState(), "MODAL_PROTECT_DISCOVER")).toBe(false);
    await expectLnsUpsellVisible();
  });

  it("should open Protect Discover when the Live App path is off and a Recover-capable device has been seen", async () => {
    const { user, store } = renderRecoverLns({
      devicesModelList: [DeviceModelId.nanoS, DeviceModelId.nanoSP],
      openRecoverFromSidebar: false,
    });

    await user.click(screen.getByRole("button", { name: "Open Recover" }));

    expect(screen.queryByText("recover player")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(isModalOpened(store.getState(), "MODAL_PROTECT_DISCOVER")).toBe(true);
  });
});
