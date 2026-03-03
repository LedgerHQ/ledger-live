import { renderHook } from "@tests/test-renderer";
import { useSendFlowBusinessLogic } from "../useSendFlowState";
import * as commonBusinessLogicModule from "@ledgerhq/live-common/flows/send/hooks/useSendFlowBusinessLogic";

jest.mock("@ledgerhq/live-common/flows/send/hooks/useSendFlowBusinessLogic");
jest.mock("../useSendFlowTransaction", () => ({
  useSendFlowTransaction: jest.fn(),
}));
jest.mock("../useSendFlowOperation", () => ({
  useSendFlowOperation: jest.fn(),
}));

const mockedUseCommonBusinessLogic = jest.mocked(
  commonBusinessLogicModule.useSendFlowBusinessLogic,
);

const mockBusinessLogicResult = {
  state: {
    account: { account: null, parentAccount: null, currency: null },
    transaction: { transaction: null, status: null, bridgePending: false, bridgeError: null },
    recipient: null,
    operation: { optimisticOperation: null, transactionError: null, signed: false },
    isLoading: false,
    flowStatus: "idle" as const,
  },
  transaction: {
    updateTransaction: jest.fn(),
    setTransaction: jest.fn(),
    setRecipient: jest.fn(),
    setAccount: jest.fn(),
  },
  operation: {
    onOperationBroadcasted: jest.fn(),
    onTransactionError: jest.fn(),
    onSigned: jest.fn(),
    onRetry: jest.fn(),
  },
  status: {
    setStatus: jest.fn(),
    setError: jest.fn(),
    setSuccess: jest.fn(),
    resetStatus: jest.fn(),
  },
  uiConfig: { hasFeePresets: false, hasCustomFees: false, hasCoinControl: false },
  recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
  recipient: null,
  setAccountAndNavigate: jest.fn(),
};

describe("useSendFlowBusinessLogic (mobile wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCommonBusinessLogic.mockReturnValue(
      mockBusinessLogicResult as unknown as ReturnType<typeof mockedUseCommonBusinessLogic>,
    );
  });

  it("spreads common businessLogic and adds close callback", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useSendFlowBusinessLogic({ onClose }));

    expect(result.current.state).toBe(mockBusinessLogicResult.state);
    expect(result.current.transaction).toBe(mockBusinessLogicResult.transaction);
    expect(result.current.close).toBe(onClose);
  });

  it("close is the provided onClose function", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useSendFlowBusinessLogic({ onClose }));

    result.current.close();
    expect(onClose).toHaveBeenCalled();
  });

  it("passes initParams to common businessLogic", () => {
    const onClose = jest.fn();
    const initParams = { recipient: "bc1qabc" };
    renderHook(() => useSendFlowBusinessLogic({ onClose, initParams }));

    expect(mockedUseCommonBusinessLogic).toHaveBeenCalledWith(
      expect.objectContaining({ initParams }),
    );
  });
});
