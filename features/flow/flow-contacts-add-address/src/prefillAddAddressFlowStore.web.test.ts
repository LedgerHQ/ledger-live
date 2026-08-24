import {
  requestPrefillAddAddressFlow,
  setPrefillAddAddressFlowListener,
} from "./prefillAddAddressFlowStore";

describe("prefillAddAddressFlowStore", () => {
  afterEach(() => {
    setPrefillAddAddressFlowListener(null);
  });

  it("should resolve as unavailable when the root is not mounted", async () => {
    await expect(
      requestPrefillAddAddressFlow({
        contactId: "contact-1" as never,
        address: "0xabc",
        currency: { currencyId: "ethereum" as never, assetDisplayName: "Ethereum" },
        network: { networkId: "ethereum", displayName: "Ethereum" },
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should forward open requests to the registered listener", async () => {
    const listener = jest.fn().mockResolvedValue({ status: "cancelled" });
    setPrefillAddAddressFlowListener(listener);

    const params = {
      contactId: "contact-1" as never,
      address: "0xabc",
      currency: { currencyId: "ethereum" as never, assetDisplayName: "Ethereum" },
      network: { networkId: "ethereum", displayName: "Ethereum" },
    };

    await expect(requestPrefillAddAddressFlow(params)).resolves.toEqual({ status: "cancelled" });
    expect(listener).toHaveBeenCalledWith(params);
  });
});
