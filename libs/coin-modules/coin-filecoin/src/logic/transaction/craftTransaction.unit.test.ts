import { craftTransaction } from "./craftTransaction";
import { fetchEstimatedFees } from "../../api/api";
import { validateAddress } from "../../network";

jest.mock("../../api/api");
jest.mock("../../network");

const mockedFetchEstimatedFees = jest.mocked(fetchEstimatedFees);
const mockedValidateAddress = jest.mocked(validateAddress);

describe("craftTransaction", () => {
  beforeEach(() => {
    mockedValidateAddress.mockImplementation((addr: string) => ({
      isValid: true,
      parsedAddress: { toString: () => addr },
    }));

    mockedFetchEstimatedFees.mockResolvedValue({
      gas_limit: 25000,
      gas_fee_cap: "100000",
      gas_premium: "2500",
      nonce: 3,
    });
  });

  afterEach(() => jest.resetAllMocks());

  it("crafts a native FIL transfer (Method 0)", async () => {
    const result = await craftTransaction({
      sender: "f1sender",
      recipient: "f1recipient",
      amount: 5000000000000000000n,
      asset: { type: "native" },
    });

    const message = JSON.parse(result.transaction);
    expect(message.method).toBe(0);
    expect(message.to).toBe("f1recipient");
    expect(message.from).toBe("f1sender");
    expect(message.value).toBe("5000000000000000000");
    expect(message.version).toBe(0);
    expect(message.nonce).toBe(3);
    expect(message.gaslimit).toBe(25000);
    expect(message.gasfeecap).toBe("100000");
    expect(message.gaspremium).toBe("2500");
  });

  it("returns gas details in the details field", async () => {
    const result = await craftTransaction({
      sender: "f1sender",
      recipient: "f1recipient",
      amount: 1000n,
      asset: { type: "native" },
    });

    expect(result.details).toEqual({
      gasLimit: 25000,
      gasFeeCap: "100000",
      gasPremium: "2500",
      nonce: 3,
    });
  });

  it("uses custom fees when provided", async () => {
    const result = await craftTransaction(
      {
        sender: "f1sender",
        recipient: "f1recipient",
        amount: 1000n,
        asset: { type: "native" },
      },
      {
        value: 999n,
        parameters: {
          gasLimit: 50000,
          gasFeeCap: "300000",
          gasPremium: "7000",
          nonce: 10,
        },
      },
    );

    const message = JSON.parse(result.transaction);
    expect(message.gaslimit).toBe(50000);
    expect(message.gasfeecap).toBe("300000");
    expect(message.gaspremium).toBe("7000");
    expect(message.nonce).toBe(10);
    expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
  });

  it("throws on invalid sender", async () => {
    mockedValidateAddress.mockReturnValueOnce({
      isValid: false,
      parsedAddress: { toString: () => "" },
    });

    await expect(
      craftTransaction({
        sender: "bad",
        recipient: "f1ok",
        amount: 100n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Invalid sender address");
  });
});
