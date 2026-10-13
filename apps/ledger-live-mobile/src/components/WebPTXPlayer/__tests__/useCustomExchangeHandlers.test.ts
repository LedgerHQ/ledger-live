import { useNavigation } from "@react-navigation/native";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import {
  handlers as exchangeHandlers,
  type SwapUiRequest,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { renderHook } from "@tests/test-renderer";
import { exchangeDeviceSession } from "LLM/features/WalletApiExchange/session/exchangeDeviceSession";
import { useDeviceIntentExchangeEnabled } from "LLM/features/WalletApiExchange/hooks/useDeviceIntentExchangeEnabled";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import type { Operation } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { useCustomExchangeHandlers } from "../CustomHandlers";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
  useRoute: jest.fn(() => ({ key: "swap", name: "Swap" })),
}));
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/server", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Exchange/server"),
  handlers: jest.fn(() => ({})),
}));
jest.mock("LLM/features/Stake", () => ({
  useOpenStakeDrawer: () => ({ handleOpenStakeDrawer: jest.fn() }),
}));
jest.mock("~/components/Stake/useStakingDrawer", () => ({
  useStakingDrawer: () => jest.fn(),
}));
const mockSyncAccountById = jest.fn();
jest.mock("~/screens/Swap/LiveApp/hooks/useSyncAccountById", () => ({
  useSyncAccountById: () => mockSyncAccountById,
}));
jest.mock("LLM/features/WalletApiExchange/hooks/useDeviceIntentExchangeEnabled", () => ({
  useDeviceIntentExchangeEnabled: jest.fn(() => false),
}));
jest.mock("LLM/features/WalletApiExchange/session/exchangeDeviceSession", () => ({
  exchangeDeviceSession: {
    requestStart: jest.fn(),
    requestComplete: jest.fn(),
    showError: jest.fn(() => true),
  },
}));
jest.mock("@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams", () => ({
  getUpdateAccountWithUpdaterParams: jest.fn(() => []),
}));

type CompleteExchangeRoute = {
  params: { onResult: (result: { error?: Error }) => void };
};

const mockNavigate = jest.fn();
const mockPop = jest.fn();

const signatureError = new CompleteExchangeError(
  "CHECK_TRANSACTION_SIGNATURE",
  "signVerificationFail",
  "Signature verification failed",
);

function failCompleteExchangeOnDevice(exchangeParams: Partial<SwapUiRequest>) {
  const onCompleteError = jest.fn();
  const onCancel = jest.fn();
  renderHook(() =>
    useCustomExchangeHandlers({
      manifest: { id: "swap" } as never,
      accounts: [],
      sendAppReady: jest.fn(),
      onCompleteError,
    }),
  );

  const [{ uiHooks }] = jest.mocked(exchangeHandlers).mock.lastCall!;
  uiHooks["custom.exchange.swap"]({
    exchangeParams: exchangeParams as SwapUiRequest,
    onSuccess: jest.fn(),
    onCancel,
  });

  const [, completeExchangeRoute] = mockNavigate.mock.calls.find(
    ([navigator, route]) =>
      navigator === NavigatorName.PlatformExchange &&
      route.screen === ScreenName.PlatformCompleteExchange,
  ) as [NavigatorName, CompleteExchangeRoute];
  completeExchangeRoute.params.onResult({ error: signatureError });

  return { onCompleteError, onCancel };
}

describe("useCustomExchangeHandlers custom.exchange.swap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDeviceIntentExchangeEnabled).mockReturnValue(false);
    jest.mocked(useNavigation).mockReturnValue({
      navigate: mockNavigate,
      pop: mockPop,
      addListener: jest.fn(() => jest.fn()),
      getParent: jest.fn(),
    } as never);
  });

  it("should not open the error screen when the swap will be retried", () => {
    const { onCompleteError, onCancel } = failCompleteExchangeOnDevice({
      willRetryOnSignatureError: true,
    });

    expect(onCancel).toHaveBeenCalledWith(signatureError);
    expect(mockPop).toHaveBeenCalledTimes(1);
    expect(onCompleteError).not.toHaveBeenCalled();
  });

  it("should open the error screen when no retry is left", () => {
    const { onCompleteError, onCancel } = failCompleteExchangeOnDevice({
      willRetryOnSignatureError: false,
    });

    expect(onCancel).toHaveBeenCalledWith(signatureError);
    expect(onCompleteError).toHaveBeenCalledWith(signatureError);
  });
});

describe("useCustomExchangeHandlers with the device intent exchange flow", () => {
  const manifest = { id: "swap", name: "Swap" };
  const mockedSession = jest.mocked(exchangeDeviceSession);

  function setup(options: { onCompleteError?: jest.Mock; onCompleteResult?: jest.Mock } = {}) {
    renderHook(() =>
      useCustomExchangeHandlers({
        manifest: manifest as never,
        accounts: [],
        sendAppReady: jest.fn(),
        handleLoaderDrawer: jest.fn(),
        ...options,
      }),
    );
    const [{ uiHooks }] = jest.mocked(exchangeHandlers).mock.lastCall!;
    return uiHooks;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDeviceIntentExchangeEnabled).mockReturnValue(true);
    jest.mocked(useNavigation).mockReturnValue({
      navigate: mockNavigate,
      pop: mockPop,
      addListener: jest.fn(() => jest.fn()),
      getParent: jest.fn(),
    } as never);
  });

  it("checks the flag for the manifest of the live app", () => {
    setup();

    expect(useDeviceIntentExchangeEnabled).toHaveBeenCalledWith("swap");
  });

  describe("custom.exchange.start", () => {
    it("asks the session for the nonce instead of opening the legacy screen", () => {
      const uiHooks = setup();
      const exchangeParams = { exchangeType: "SELL", provider: "coinify" };
      const onSuccess = jest.fn();
      const onCancel = jest.fn();

      uiHooks["custom.exchange.start"]({ exchangeParams, onSuccess, onCancel } as never);

      expect(mockedSession.requestStart).toHaveBeenCalledWith({
        manifest,
        exchangeParams,
        continuesOnDevice: false,
        onSuccess,
        onCancel,
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("keeps the device session for a swap that goes straight on to the confirmation", () => {
      const uiHooks = setup();

      uiHooks["custom.exchange.start"]({
        exchangeParams: { exchangeType: "SWAP" },
        continuesOnDevice: true,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      } as never);

      expect(mockedSession.requestStart).toHaveBeenCalledWith(
        expect.objectContaining({ continuesOnDevice: true }),
      );
    });
  });

  describe("custom.exchange.swap", () => {
    const exchangeParams = {
      provider: "changelly",
      swapId: "swap-1",
      exchange: { fromAccount: { id: "from" } },
      transaction: { recipient: "payin" },
      magnitudeAwareRate: 2,
    } as unknown as SwapUiRequest;
    const operation = { id: "op", hash: "0xhash" } as unknown as Operation;

    function requestSwap(
      options: Parameters<typeof setup>[0] = {},
      params: Partial<SwapUiRequest> = {},
    ) {
      const uiHooks = setup(options);
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      uiHooks["custom.exchange.swap"]({
        exchangeParams: { ...exchangeParams, ...params },
        onSuccess,
        onCancel,
      });
      const [request] = mockedSession.requestComplete.mock.lastCall!;
      return { request, onSuccess, onCancel };
    }

    it("asks the session to confirm and sign, without the loader screen or the legacy one", () => {
      const { request } = requestSwap();

      expect(request.manifest).toEqual(manifest);
      expect(request.exchangeParams.swapId).toBe("swap-1");
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockPop).not.toHaveBeenCalled();
    });

    it("reports the broadcast swap to the live app after the side effects, in the legacy order", () => {
      const order: string[] = [];
      const onCompleteResult = jest.fn(() => order.push("onCompleteResult"));
      mockSyncAccountById.mockImplementation(() => order.push("sync"));
      jest.mocked(getUpdateAccountWithUpdaterParams).mockReturnValue(["from", jest.fn()] as never);
      const { request, onSuccess } = requestSwap({ onCompleteResult });
      onSuccess.mockImplementation(() => order.push("onSuccess"));

      request.onSuccess(operation);

      expect(mockSyncAccountById).toHaveBeenCalledWith("from");
      expect(onCompleteResult).toHaveBeenCalledWith(expect.anything(), "0xhash");
      expect(onSuccess).toHaveBeenCalledWith({ operationHash: "0xhash", swapId: "swap-1" });
      expect(order).toEqual(["sync", "onCompleteResult", "onSuccess"]);
    });

    it("still reports a broadcast swap when there is no account to update", () => {
      jest.mocked(getUpdateAccountWithUpdaterParams).mockReturnValue([] as never);
      const { request, onSuccess } = requestSwap();

      request.onSuccess(operation);

      expect(onSuccess).toHaveBeenCalledWith({ operationHash: "0xhash", swapId: "swap-1" });
    });

    it.each([
      ["fails", new Error("payout address rejected")],
      ["is retried", signatureError],
      [
        "is refused on the device",
        Object.assign(new Error("Operation denied on device"), {
          name: "TransactionRefusedOnDevice",
        }),
      ],
      [
        "is closed by the user",
        Object.assign(new Error("User closed the drawer"), { name: "DrawerClosedError" }),
      ],
    ])(
      "answers the live app when the swap %s, and leaves the error to the drawer",
      (_name, error) => {
        const onCompleteError = jest.fn();
        const { request, onCancel } = requestSwap({ onCompleteError });

        request.onCancel(error);

        expect(onCancel).toHaveBeenCalledWith(error);
        expect(onCompleteError).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );

    it("answers the live app once, however many times the session cancels", () => {
      const { request, onCancel } = requestSwap();

      request.onCancel(new Error("first"));
      request.onCancel(new Error("second"));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom.exchange.complete", () => {
    const exchangeParams = { provider: "coinify", exchange: {} } as unknown as SwapUiRequest;

    function requestComplete(options: Parameters<typeof setup>[0] = {}) {
      const uiHooks = setup(options);
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      uiHooks["custom.exchange.complete"]({ exchangeParams, onSuccess, onCancel });
      const [request] = mockedSession.requestComplete.mock.lastCall!;
      return { request, onSuccess, onCancel };
    }

    it("reports the hash of the broadcast operation to the live app", () => {
      const onCompleteResult = jest.fn();
      const { request, onSuccess } = requestComplete({ onCompleteResult });

      request.onSuccess({ hash: "0xhash" } as Operation);

      expect(onCompleteResult).toHaveBeenCalledWith(exchangeParams, "0xhash");
      expect(onSuccess).toHaveBeenCalledWith("0xhash");
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it.each([
      ["fails", new Error("failed")],
      [
        "is refused on the device",
        Object.assign(new Error("Operation denied on device"), {
          name: "TransactionRefusedOnDevice",
        }),
      ],
      ["is closed by the user", Object.assign(new Error("closed"), { name: "DrawerClosedError" })],
    ])(
      "answers the live app when the exchange %s, and leaves the error to the drawer",
      (_name, error) => {
        const onCompleteError = jest.fn();
        const { request, onCancel } = requestComplete({ onCompleteError });

        request.onCancel(error);

        expect(onCancel).toHaveBeenCalledWith(error);
        expect(onCompleteError).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );
  });

  describe("custom.exchange.error", () => {
    const error = Object.assign(new Error("failed"), { cause: { message: "failed" } });

    it("has the open drawer show the error, with no screen and no loader to pop", () => {
      const onCompleteError = jest.fn();
      const uiHooks = setup({ onCompleteError });

      uiHooks["custom.exchange.error"]({ error, onSuccess: jest.fn(), onCancel: jest.fn() });

      expect(mockedSession.showError).toHaveBeenCalledWith("swap", error);
      expect(onCompleteError).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockPop).not.toHaveBeenCalled();
    });

    it("falls back to the error screen when there is no drawer to show it", () => {
      mockedSession.showError.mockReturnValueOnce(false);
      const onCompleteError = jest.fn();
      const uiHooks = setup({ onCompleteError });

      uiHooks["custom.exchange.error"]({ error, onSuccess: jest.fn(), onCancel: jest.fn() });

      expect(onCompleteError).toHaveBeenCalledWith(error);
      expect(mockPop).not.toHaveBeenCalled();
    });

    it("opens the swap error screen when nothing else handles the fallback", () => {
      mockedSession.showError.mockReturnValueOnce(false);
      const uiHooks = setup();

      uiHooks["custom.exchange.error"]({ error, onSuccess: jest.fn(), onCancel: jest.fn() });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
        screen: ScreenName.SwapCustomError,
        params: { error },
      });
    });
  });
});
