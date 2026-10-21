import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import type { TFunction } from "i18next";
import { act, renderHook } from "@tests/test-renderer";
import {
  ESTIMATED_TIME_LEARN_MORE_URL,
  getEstimatedSendTimeMs,
} from "@ledgerhq/live-common/families/aleo/estimatedTime";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import {
  formatEstimatedDuration,
  useAleoEstimatedTimeViewModel,
} from "./useAleoEstimatedTimeViewModel";

jest.mock("@ledgerhq/live-common/families/aleo/estimatedTime", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/estimatedTime"),
  getEstimatedSendTimeMs: jest.fn(),
}));

const mockedGetEstimatedSendTimeMs = jest.mocked(getEstimatedSendTimeMs);

const t = ((key: string, options?: { count?: number }) =>
  `${key}:${options?.count}`) as unknown as TFunction;

const transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

describe("formatEstimatedDuration", () => {
  it.each([
    [12_500, "aleo.send.estimatedTime.seconds:13"],
    [400, "aleo.send.estimatedTime.seconds:1"],
    [62_500, "aleo.send.estimatedTime.minutes:1"],
    [100_000, "aleo.send.estimatedTime.minutes:1.5"],
    [125_000, "aleo.send.estimatedTime.minutes:2"],
  ])("GIVEN %d ms WHEN formatted THEN it reads %s", (ms, expected) => {
    expect(formatEstimatedDuration(ms, t)).toBe(expected);
  });
});

describe("useAleoEstimatedTimeViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetEstimatedSendTimeMs.mockReturnValue(12_500);
  });

  it("GIVEN a transaction WHEN rendered THEN its estimate and explainer copy are exposed", () => {
    const { result } = renderHook(() => useAleoEstimatedTimeViewModel(transaction));

    expect(mockedGetEstimatedSendTimeMs).toHaveBeenCalledWith(transaction);
    expect(result.current.label).toBe("Est. time");
    expect(result.current.value).toBe("~13s");
    expect(result.current.info.title).toBe("How estimated time works");
    expect(result.current.info.confirmLabel).toBe("Got it");
    expect(result.current.info.learnMoreLabel).toBe("Learn more");
  });

  it("GIVEN the explainer WHEN learn more is pressed THEN the support article opens", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderHook(() => useAleoEstimatedTimeViewModel(transaction));

    act(() => result.current.info.onLearnMore());

    expect(openURL).toHaveBeenCalledWith(ESTIMATED_TIME_LEARN_MORE_URL);
  });
});
