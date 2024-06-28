import { faker } from "@faker-js/faker";
import { getBalance } from "./getBalance";

const mockGetAccountInfo = jest.fn();
jest.mock("../network", () => ({
  getAccountInfo: (arg: unknown) => mockGetAccountInfo(arg),
}));

describe("getBalance", () => {
  afterEach(() => {
    mockGetAccountInfo.mockClear();
  });

  it("returns the balance from Explorer", async () => {
    // Given
    const balance = faker.number.bigInt(100_000_000);
    const address = "ACCOUNT_ADDRESS";
    mockGetAccountInfo.mockResolvedValue({
      account_data: {
        Balance: balance.toString(),
      },
    });

    // When
    const result = await getBalance(address);

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(mockGetAccountInfo.mock.lastCall[0]).toEqual(address);
    expect(result).toEqual(balance);
  });
});
