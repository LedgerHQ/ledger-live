import { cachedRecipientIsNew } from "./utils";

jest.mock("ripple-address-codec", () => ({
  isValidClassicAddress: () => true,
}));
const mockGetAccountInfo = jest.fn();
jest.mock("../network", () => ({
  getAccountInfo: (address: string) => mockGetAccountInfo(address),
}));

describe("cachedRecipientIsNew", () => {
  afterEach(() => {
    mockGetAccountInfo.mockClear();
  });

  it("returns true when network returns a new empty account", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValueOnce({
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });

    // When
    const result = await cachedRecipientIsNew("address1");

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it("returns false when network a valid AccountInfo", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValueOnce({
      isNewAccount: false,
      balance: "999441667919804",
      ownerCount: 0,
      sequence: 999441667919804,
    });

    // When
    const result = await cachedRecipientIsNew("address2");

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(result).toBeFalsy();
  });

  it("throws an error when network throws an error", async () => {
    // Given
    mockGetAccountInfo.mockImplementationOnce(() => {
      throw new Error("Malformed address");
    });

    // When & Then
    await expect(cachedRecipientIsNew("address3")).rejects.toThrow("Malformed address");
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
  });
});
