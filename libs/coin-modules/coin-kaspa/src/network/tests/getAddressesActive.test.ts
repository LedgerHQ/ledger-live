import { getAddressesActive } from "../index";

describe("getAddressesActive function", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });

  it("Gets information about addresses being active or not", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
          active: true,
        },
      ],
    });
    const addresses = ["kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e"];
    const result = await getAddressesActive(addresses);

    const expectedResult = [
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        active: true,
      },
    ];

    expect(result).toEqual(expectedResult);
  });
  it("Wrong address should deliver false", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp42",
          active: false,
        },
      ],
    });

    const addresses = ["kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp42"];
    const result = await getAddressesActive(addresses);

    const expectedResult = [
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp42",
        active: false,
      },
    ];

    expect(result).toEqual(expectedResult);
  });

  it("Should throw an error if the server returns a bad response", async () => {
    const addresses = ["kaspa:invalid_address"];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(getAddressesActive(addresses)).rejects.toThrow(
      "Failed to fetch active state for addresses kaspa:invalid_address. Status: 404",
    );
  });

  it("Should throw an error if fetch throws an exception", async () => {
    const addresses = ["kaspa:another_invalid_address"];
    global.fetch = jest.fn().mockImplementationOnce(() => {
      throw new Error("Network Error");
    });

    await expect(getAddressesActive(addresses)).rejects.toThrow(
      "Error fetching AddressesActives: Network Error",
    );
  });
});
