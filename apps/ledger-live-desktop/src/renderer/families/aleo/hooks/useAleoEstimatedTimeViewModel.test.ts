/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "tests/testSetup";
import type { TFunction } from "i18next";
import {
  ESTIMATED_TIME_LEARN_MORE_URL,
  getEstimatedSendTimeMs,
} from "@ledgerhq/live-common/families/aleo/estimatedTime";
import { openURL } from "~/renderer/linking";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import {
  formatEstimatedDuration,
  useAleoEstimatedTimeViewModel,
} from "./useAleoEstimatedTimeViewModel";

jest.mock("@ledgerhq/live-common/families/aleo/estimatedTime", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/estimatedTime"),
  getEstimatedSendTimeMs: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedGetEstimatedSendTimeMs = jest.mocked(getEstimatedSendTimeMs);
const mockedOpenURL = jest.mocked(openURL);

const t = ((key: string, options?: { count?: number }) =>
  `${key}:${options?.count}`) as unknown as TFunction;

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetEstimatedSendTimeMs.mockReturnValue(12_500);
});

describe("formatEstimatedDuration", () => {
  it.each([
    [12_500, "aleo.send.estimatedTime.seconds:13"],
    [400, "aleo.send.estimatedTime.seconds:1"],
    [62_500, "aleo.send.estimatedTime.minutes:1"],
    [100_000, "aleo.send.estimatedTime.minutes:1.5"],
    [125_000, "aleo.send.estimatedTime.minutes:2"],
  ])("formats %d ms as %s", (ms, expected) => {
    expect(formatEstimatedDuration(ms, t)).toBe(expected);
  });
});

describe("useAleoEstimatedTimeViewModel", () => {
  it("formats the estimate of the transaction with its explainer copy", () => {
    const transaction = makeAleoTransaction();

    const { result } = renderHook(() => useAleoEstimatedTimeViewModel(transaction));

    expect(mockedGetEstimatedSendTimeMs).toHaveBeenCalledWith(transaction);
    expect(result.current.label).toBe("Est. time");
    expect(result.current.value).toBe("~13s");
    expect(result.current.info.title).toBe("How estimated time works");
    expect(result.current.info.learnMoreLabel).toBe("Learn more");
  });

  it("opens and closes the explainer and follows the learn more link", () => {
    const { result } = renderHook(() => useAleoEstimatedTimeViewModel(makeAleoTransaction()));
    expect(result.current.info.isOpen).toBe(false);

    act(() => result.current.info.onOpen());
    expect(result.current.info.isOpen).toBe(true);

    act(() => result.current.info.onLearnMore());
    expect(mockedOpenURL).toHaveBeenCalledWith(ESTIMATED_TIME_LEARN_MORE_URL);

    act(() => result.current.info.onClose());
    expect(result.current.info.isOpen).toBe(false);
  });
});
