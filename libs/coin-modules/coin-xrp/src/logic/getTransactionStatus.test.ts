import { getTransactionStatus } from "./getTransactionStatus";
import * as logic from "./index";

const mockGetServerInfos = jest.fn();
const mockCachedRecipientIsNew = jest.fn();

jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
}));

jest.spyOn(logic, "cachedRecipientIsNew").mockImplementation(addr => {
  if (addr === RECIPIENT_NEW) {
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
});

const reserveBase = 10_000_000n; // 10 XRP (drops)

const SENDER = "rPSCfmnX3t9jQJG5RNcZtSaP5UhExZDue4";
const RECIPIENT = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";
const RECIPIENT_NEW = "rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK";

const account = {
  address: SENDER,
  balance: 50_000_000n,
  currencyUnit: {
    code: "XRP",
    magnitude: 6,
    name: "XRP",
    symbol: "XRP",
  },
  currencyName: "XRP",
};

describe("getTransactionStatus", () => {
  afterEach(() => {
    mockGetServerInfos.mockReset();
    mockCachedRecipientIsNew.mockReset();
  });

  it("returns no errors on valid transaction", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n, // XRP value, not drops
        },
      },
    });

    mockCachedRecipientIsNew.mockResolvedValue(false);

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 20_000_000n,
        fee: 10_000n,
        recipient: RECIPIENT,
      } as any,
    );

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.totalSpent).toBe(20_010_000n);
  });

  it("throws FeeTooHigh warning when fee is >10% of amount", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 1_000_000n,
        fee: 200_000n, // 20%
        recipient: RECIPIENT,
      } as any,
    );

    expect(result.warnings.feeTooHigh).toBeInstanceOf(Error);
    expect(result.errors).toEqual({});
  });

  it("errors when fee is missing", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 10_000_000n,
        recipient: RECIPIENT,
      } as any,
    );

    expect(result.errors.fee?.name).toBe("FeeNotLoaded");
  });

  it("errors if recipient is same as sender", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 10_000_000n,
        fee: 10_000n,
        recipient: SENDER,
      } as any,
    );

    expect(result.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("errors if recipient is new and amount is too low", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    mockCachedRecipientIsNew.mockResolvedValue(true);

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 5_000_000n,
        fee: 10_000n,
        recipient: RECIPIENT_NEW,
      } as any,
    );

    expect(result.errors.amount?.name).toBe("NotEnoughBalanceBecauseDestinationNotCreated");
  });

  it("errors if amount is zero", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 0n,
        fee: 10_000n,
        recipient: RECIPIENT,
      } as any,
    );

    expect(result.errors.amount?.name).toBe("AmountRequired");
  });

  it("errors if recipient is invalid", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 1_000_000n,
        fee: 10_000n,
        recipient: "not-an-address",
      } as any,
    );

    expect(result.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("errors if recipient is missing", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });

    const result = await getTransactionStatus(
      account as any,
      {
        amount: 1_000_000n,
        fee: 10_000n,
        recipient: "",
      } as any,
    );

    expect(result.errors.recipient?.name).toBe("RecipientRequired");
  });
});
