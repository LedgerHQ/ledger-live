import { getBalance } from "./getBalance";
import { getAccount } from "../network";

// Mock the getAccount function
jest.mock("../network", () => ({
  getAccount: jest.fn().mockResolvedValue({ balance: 1000000000 }),
}));

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct balance as bigint", async () => {
    // Mock the getAccount response
    const mockBalance = { balance: 1000000000 };

    const address = "0x123";
    const result = await getBalance(address);

    expect(getAccount).toHaveBeenCalledWith(address);
    expect(result[0].value).toBe(BigInt(mockBalance.balance.toString()));
  });
});
