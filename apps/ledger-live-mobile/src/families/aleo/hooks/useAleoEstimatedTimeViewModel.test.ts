import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import { act, renderHook } from "@tests/test-renderer";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { useAleoEstimatedTimeViewModel } from "./useAleoEstimatedTimeViewModel";

jest.mock("@ledgerhq/live-common/families/aleo/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/config"),
  getAleoCurrencyConfigById: jest.fn(),
}));

const mockedGetAleoCurrencyConfigById = jest.mocked(getAleoCurrencyConfigById);

type AleoCoinConfig = NonNullable<ReturnType<typeof getAleoCurrencyConfigById>>;

const publicTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

function makePrivateTransaction(amountRecordCount: number, feeRecordCommitment: string | null) {
  return {
    ...publicTransaction,
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: {
      amountRecordCommitments: Array.from({ length: amountRecordCount }, (_, i) => `record-${i}`),
      feeRecordCommitment,
    },
  } as Transaction;
}

function mockPickingStrategy(recordPickingStrategy: AleoCoinConfig["recordPickingStrategy"]) {
  mockedGetAleoCurrencyConfigById.mockReturnValue({ recordPickingStrategy } as AleoCoinConfig);
}

function renderViewModel(transaction: Transaction) {
  return renderHook(() => useAleoEstimatedTimeViewModel(ALEO_ACCOUNT_1, transaction));
}

describe("useAleoEstimatedTimeViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickingStrategy("auto");
  });

  it("GIVEN a public transaction WHEN rendered THEN no estimate is exposed", () => {
    const { result } = renderViewModel(publicTransaction);

    expect(result.current).toBeNull();
  });

  it("GIVEN manual record picking WHEN rendered THEN no estimate is exposed", () => {
    mockPickingStrategy("manual");

    const { result } = renderViewModel(makePrivateTransaction(2, "fee-record"));

    expect(result.current).toBeNull();
  });

  it("GIVEN no loaded currency config WHEN rendered THEN no estimate is exposed", () => {
    mockedGetAleoCurrencyConfigById.mockReturnValue(undefined);

    const { result } = renderViewModel(makePrivateTransaction(2, "fee-record"));

    expect(result.current).toBeNull();
  });

  it("GIVEN a private transaction with records WHEN rendered THEN its signing time and explainer copy are exposed", () => {
    const { result } = renderViewModel(makePrivateTransaction(1, "fee-record"));

    expect(mockedGetAleoCurrencyConfigById).toHaveBeenCalledWith(ALEO_ACCOUNT_1.currency.id);
    expect(result.current?.label).toBe("Signing time");
    expect(result.current?.value).toMatch(/^~\d+ (s|min)$/);
    expect(result.current?.info.title).toBe("Signing time");
    expect(result.current?.info.confirmLabel).toBe("Got it");
    expect(result.current?.info.learnMoreLabel).toBe("Learn more");
  });

  it("GIVEN the explainer WHEN learn more is pressed THEN the Aleo support article opens", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderViewModel(makePrivateTransaction(1, null));

    act(() => result.current?.info.onLearnMore());

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("Aleo-ALEO"));
  });
});
