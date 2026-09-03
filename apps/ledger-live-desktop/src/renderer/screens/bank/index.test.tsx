import React from "react";
import { render, screen } from "tests/testSetup";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { RECEIVE_SOURCE_PAGE } from "LLD/features/Receive/types";
import Bank from ".";

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/hooks/useManifestWithSessionId", () => ({
  useManifestWithSessionId: ({ manifest }: { manifest: unknown }) => ({
    manifest,
    loading: false,
  }),
}));
jest.mock("~/renderer/components/WebPlatformPlayer", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      close
    </button>
  ),
}));

const mockedUseRemoteLiveAppManifest = jest.mocked(useRemoteLiveAppManifest);
const mockedUseLocalLiveAppManifest = jest.mocked(useLocalLiveAppManifest);

const manifest = {
  id: "noah",
  name: "Noah",
  url: "https://noah.example",
} as never;

describe("Bank screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRemoteLiveAppManifest.mockReturnValue(manifest);
    mockedUseLocalLiveAppManifest.mockReturnValue(undefined);
  });

  it("should reopen the receive dialog when leaving Noah from the receive flow", async () => {
    const { user, store } = render(<Bank />, { initialRoute: "/bank" });

    await user.click(screen.getByRole("button", { name: "close" }));

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: { sourcePage: RECEIVE_SOURCE_PAGE.BANK },
    });
  });

  it("should not reopen the receive dialog when leaving Noah from Pay bank transfer", async () => {
    const { user, store } = render(<Bank />, { initialRoute: "/bank?noahAuth=createAccount" });

    await user.click(screen.getByRole("button", { name: "close" }));

    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();
  });
});
