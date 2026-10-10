import { useNavigation } from "@react-navigation/native";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import {
  handlers as exchangeHandlers,
  type SwapUiRequest,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { renderHook } from "@tests/test-renderer";
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
jest.mock("~/screens/Swap/LiveApp/hooks/useSyncAccountById", () => ({
  useSyncAccountById: () => jest.fn(),
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
