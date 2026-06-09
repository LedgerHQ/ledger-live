import React from "react";
import { render } from "@tests/test-renderer";
import { useRemoteLiveAppContext, useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { createOpenMenuBottomSheetHandler } from "~/components/WebPTXPlayer/CustomHandlers";
import { createOpenActionDialogHandler } from "~/components/WebPTXPlayer/actionDialogStore";
import { createOpenBorrowInfoBottomSheetHandler } from "LLM/features/Borrow/handlers/borrowDialogHandlers";
import { BorrowLiveAppWrapper } from "../BorrowLiveAppWrapper";

jest.mock("~/components/Web3AppWebview/helpers", () => ({
  initialWebviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
  },
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLM/features/Borrow/hooks/useBorrowLiveConfig", () => ({
  useBorrowLiveConfig: jest.fn().mockReturnValue(undefined),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn().mockReturnValue("US"),
}));

jest.mock("~/components/WebPTXPlayer/CustomHandlers", () => ({
  createOpenMenuBottomSheetHandler: jest.fn(),
}));

jest.mock("~/components/WebPTXPlayer/actionDialogStore", () => ({
  createOpenActionDialogHandler: jest.fn(),
}));

jest.mock("LLM/features/Borrow/handlers/borrowDialogHandlers", () => ({
  createOpenBorrowInfoBottomSheetHandler: jest.fn(),
}));

const capturedCustomHandlers: { current: WalletAPICustomHandlers | undefined } = {
  current: undefined,
};

jest.mock("LLM/features/Borrow/components/BorrowWebView", () => ({
  BorrowWebView: React.forwardRef(function MockBorrowWebView(
    props: { customHandlers?: WalletAPICustomHandlers },
    _ref: React.Ref<unknown>,
  ) {
    capturedCustomHandlers.current = props.customHandlers;
    return <></>;
  }),
}));

const mockManifest = { id: "borrow", url: "https://borrow.example.com" } as unknown as LiveAppManifest;

describe("BorrowLiveAppWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCustomHandlers.current = undefined;
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(mockManifest);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
  });

  it("should render without crashing", () => {
    const { getByTestId } = render(<BorrowLiveAppWrapper />);
    expect(getByTestId("borrow-screen")).toBeVisible();
  });

  describe("custom handlers", () => {
    const infoHandler = jest.fn();
    const menuHandler = jest.fn();
    const dialogHandler = jest.fn();

    beforeEach(() => {
      jest.mocked(createOpenBorrowInfoBottomSheetHandler).mockReturnValue(infoHandler);
      jest.mocked(createOpenMenuBottomSheetHandler).mockReturnValue(menuHandler);
      jest.mocked(createOpenActionDialogHandler).mockReturnValue(dialogHandler);
    });

    it("should wire custom.bottomSheet.info, custom.bottomSheet.menu and custom.dialog.confirmation handlers", () => {
      render(<BorrowLiveAppWrapper />);

      expect(capturedCustomHandlers.current).toBeDefined();
      expect(capturedCustomHandlers.current?.["custom.bottomSheet.info"]).toBe(infoHandler);
      expect(capturedCustomHandlers.current?.["custom.bottomSheet.menu"]).toBe(menuHandler);
      expect(capturedCustomHandlers.current?.["custom.dialog.confirmation"]).toBe(dialogHandler);
    });

    it("should build the info handler with the borrow-scoped factory", () => {
      render(<BorrowLiveAppWrapper />);

      expect(createOpenBorrowInfoBottomSheetHandler).toHaveBeenCalledTimes(1);
    });

    it("should build each handler with the dispatch from the redux store", () => {
      render(<BorrowLiveAppWrapper />);

      expect(createOpenBorrowInfoBottomSheetHandler).toHaveBeenCalledTimes(1);
      expect(createOpenMenuBottomSheetHandler).toHaveBeenCalledTimes(1);
      expect(createOpenActionDialogHandler).toHaveBeenCalledTimes(1);

      const dispatchArg = jest.mocked(createOpenBorrowInfoBottomSheetHandler).mock.calls[0][0];
      expect(typeof dispatchArg).toBe("function");
      expect(jest.mocked(createOpenMenuBottomSheetHandler).mock.calls[0][0]).toBe(dispatchArg);
      expect(jest.mocked(createOpenActionDialogHandler).mock.calls[0][0]).toBe(dispatchArg);
    });
  });
});
