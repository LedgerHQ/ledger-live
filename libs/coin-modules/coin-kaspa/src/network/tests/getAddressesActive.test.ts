import { getUtxosForAddresses } from "../indexer-api/getUtxosForAddresses";
import { getAddressesActive } from "../indexer-api/getAddressesActive";

describe("getAddressesActive function", () => {
  it("Gets information about addresses being active or not", async () => {
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

  it("should throw an error if the response is not ok", async () => {
    const addresses = ["invalidAddress"];
    await expect(getUtxosForAddresses(addresses)).rejects.toThrow();
  });
});
