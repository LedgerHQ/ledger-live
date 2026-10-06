/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "tests/testSetup";
import type { TFunction } from "i18next";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { openURL } from "~/renderer/linking";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { formatEstimatedDuration, useEstimatedTimeViewModel } from "../useEstimatedTimeViewModel";

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedOpenURL = jest.mocked(openURL);

const account = {
  id: "aleo-1",
  type: "Account",
  currency: { id: "aleo", family: "aleo", type: "CryptoCurrency" },
};
const transaction = { family: "aleo", mode: "transfer_public" };

const t = ((key: string, options?: { count?: number }) =>
  `${key}:${options?.count}`) as unknown as TFunction;

function mockState() {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: { account, parentAccount: null },
      transaction: { transaction },
    },
  } as never);
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockState();
});

describe("formatEstimatedDuration", () => {
  it.each([
    [12_500, "newSendFlow.estimatedTime.seconds:13"],
    [400, "newSendFlow.estimatedTime.seconds:1"],
    [62_500, "newSendFlow.estimatedTime.minutes:1"],
    [100_000, "newSendFlow.estimatedTime.minutes:1.5"],
    [125_000, "newSendFlow.estimatedTime.minutes:2"],
  ])("formats %d ms as %s", (ms, expected) => {
    expect(formatEstimatedDuration(ms, t)).toBe(expected);
  });
});

describe("useEstimatedTimeViewModel", () => {
  it("is null for a coin that declares no estimate", () => {
    jest.spyOn(sendFeatures, "getEstimatedTime").mockReturnValue(null);

    const { result } = renderHook(() => useEstimatedTimeViewModel());

    expect(result.current).toBeNull();
  });

  it("formats the estimate and resolves the explainer copy from the descriptor", () => {
    jest.spyOn(sendFeatures, "getEstimatedTime").mockReturnValue({
      ms: 12_500,
      translationKey: "estimatedTime.aleo",
      learnMoreUrl: "https://support.ledger.com/article/Aleo-ALEO",
    });

    const { result } = renderHook(() => useEstimatedTimeViewModel());

    expect(result.current?.label).toBe("Est. time");
    expect(result.current?.value).toBe("~13s");
    expect(result.current?.info.title).toBe("How estimated time works");
    expect(result.current?.info.learnMoreLabel).toBe("Learn more");
  });

  it("opens and closes the explainer and follows the learn more link", () => {
    jest.spyOn(sendFeatures, "getEstimatedTime").mockReturnValue({
      ms: 12_500,
      translationKey: "estimatedTime.aleo",
      learnMoreUrl: "https://support.ledger.com/article/Aleo-ALEO",
    });

    const { result } = renderHook(() => useEstimatedTimeViewModel());
    expect(result.current?.info.isOpen).toBe(false);

    act(() => result.current?.info.onOpen());
    expect(result.current?.info.isOpen).toBe(true);

    act(() => result.current?.info.onLearnMore());
    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/article/Aleo-ALEO");

    act(() => result.current?.info.onClose());
    expect(result.current?.info.isOpen).toBe(false);
  });

  it("hides the learn more action when the descriptor gives no link", () => {
    jest.spyOn(sendFeatures, "getEstimatedTime").mockReturnValue({
      ms: 12_500,
      translationKey: "estimatedTime.aleo",
    });

    const { result } = renderHook(() => useEstimatedTimeViewModel());

    expect(result.current?.info.learnMoreLabel).toBeNull();
  });
});
