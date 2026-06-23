import React from "react";
import { render } from "@tests/test-renderer";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { createOpenBorrowInfoBottomSheetHandler } from "LLM/features/Borrow/handlers/borrowDialogHandlers";
import { createOpenBorrowErrorBottomSheetHandler } from "LLM/features/Borrow/handlers/borrowErrorBottomSheetStore";
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

jest.mock("LLM/features/Borrow/handlers/borrowDialogHandlers", () => ({
  createOpenBorrowInfoBottomSheetHandler: jest.fn(),
}));

jest.mock("LLM/features/Borrow/handlers/borrowErrorBottomSheetStore", () => ({
  createOpenBorrowErrorBottomSheetHandler: jest.fn(),
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

const mockManifest = {
  id: "borrow",
  url: "https://borrow.example.com",
} as unknown as LiveAppManifest;

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
    const errorHandler = jest.fn();

    beforeEach(() => {
      jest.mocked(createOpenBorrowInfoBottomSheetHandler).mockReturnValue(infoHandler);
      jest.mocked(createOpenBorrowErrorBottomSheetHandler).mockReturnValue(errorHandler);
    });

    it("should wire the custom.bottomSheet.info handler", () => {
      render(<BorrowLiveAppWrapper />);

      expect(capturedCustomHandlers.current).toBeDefined();
      expect(capturedCustomHandlers.current?.["custom.bottomSheet.info"]).toBe(infoHandler);
    });

    it("should wire the custom.bottomSheet.error handler", () => {
      render(<BorrowLiveAppWrapper />);

      expect(capturedCustomHandlers.current?.["custom.bottomSheet.error"]).toBe(errorHandler);
    });

    it("should not wire the menu or confirmation handlers", () => {
      render(<BorrowLiveAppWrapper />);

      expect(capturedCustomHandlers.current?.["custom.bottomSheet.menu"]).toBeUndefined();
      expect(capturedCustomHandlers.current?.["custom.dialog.confirmation"]).toBeUndefined();
    });

    it("should build the info handler with the dispatch from the redux store", () => {
      render(<BorrowLiveAppWrapper />);

      expect(createOpenBorrowInfoBottomSheetHandler).toHaveBeenCalledTimes(1);
      const dispatchArg = jest.mocked(createOpenBorrowInfoBottomSheetHandler).mock.calls[0][0];
      expect(typeof dispatchArg).toBe("function");
    });

    it("should build the error handler with the dispatch from the redux store", () => {
      render(<BorrowLiveAppWrapper />);

      expect(createOpenBorrowErrorBottomSheetHandler).toHaveBeenCalledTimes(1);
      const dispatchArg = jest.mocked(createOpenBorrowErrorBottomSheetHandler).mock.calls[0][0];
      expect(typeof dispatchArg).toBe("function");
    });
  });
});
