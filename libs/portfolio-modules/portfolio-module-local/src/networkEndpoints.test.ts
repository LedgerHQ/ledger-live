import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { networkEndpoints } from "./networkEndpoints";
import { aLocalNetwork, someDeps, type FakeNetwork } from "./test-utils";

const setUp = () => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const ethereum: FakeNetwork = aLocalNetwork({ currencyId: "ethereum" });
  return { bitcoin, ethereum, ...networkEndpoints(someDeps({ networks: { bitcoin, ethereum } })) };
};

describe("networkEndpoints", () => {
  it("lists the networks served locally", async () => {
    expect(await setUp().listNetworks()).toEqual(["bitcoin", "ethereum"]);
  });

  it("returns the last block with ISO dates and its parent", async () => {
    const { bitcoin, getLastBlock } = setUp();
    bitcoin.coinModule.lastBlock
      .mockResolvedValueOnce({
        height: 10,
        hash: "h10",
        time: new Date("2026-01-01T00:00:00.000Z"),
        parent: { height: 9, hash: "h9" },
      })
      .mockResolvedValueOnce({
        height: 11,
        hash: "h11",
        time: new Date("2026-01-01T00:10:00.000Z"),
      });

    expect(await getLastBlock("bitcoin")).toEqual({
      height: 10,
      hash: "h10",
      time: "2026-01-01T00:00:00.000Z",
      parent: { height: 9, hash: "h9" },
    });
    expect(await getLastBlock("bitcoin")).toEqual({
      height: 11,
      hash: "h11",
      time: "2026-01-01T00:10:00.000Z",
    });
    expect(bitcoin.coinModule.lastBlock).toHaveBeenCalledWith(bitcoin.context);
  });

  it("returns the validators with JSON safe values, and the next cursor", async () => {
    const { ethereum, getValidators } = setUp();
    ethereum.coinModule.getValidators
      .mockResolvedValueOnce({
        items: [
          {
            id: "v1",
            address: "0xv1",
            name: "Validator",
            description: undefined,
            balance: 32n,
            commissionRate: "5",
            apy: 0.04,
          },
        ],
        next: "page-2",
      })
      .mockResolvedValueOnce({ items: [] });

    expect(await getValidators("ethereum")).toEqual({
      items: [
        {
          id: "v1",
          address: "0xv1",
          name: "Validator",
          balance: "32",
          commissionRate: "5",
          apy: 0.04,
        },
      ],
      next: "page-2",
    });
    expect(await getValidators("ethereum", { cursor: "page-2" })).toEqual({ items: [] });
    expect(ethereum.coinModule.getValidators).toHaveBeenLastCalledWith(ethereum.context, {
      cursor: "page-2",
    });
  });

  it("answers validators unsupported when the coin module does not serve them", async () => {
    const { bitcoin, ethereum, getValidators } = setUp();
    bitcoin.coinModule.supports = jest.fn(() => false);
    delete (ethereum.coinModule as Partial<typeof ethereum.coinModule>).getValidators;

    await expect(getValidators("bitcoin")).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", "getValidators is not supported on bitcoin"),
    );
    await expect(getValidators("ethereum")).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", "getValidators is not supported on ethereum"),
    );
    expect(bitcoin.coinModule.supports).toHaveBeenCalledWith("getValidators");
    expect(bitcoin.coinModule.getValidators).not.toHaveBeenCalled();
  });

  it("validates an address for the network currency", async () => {
    const { ethereum, validateAddress } = setUp();
    ethereum.coinModule.validateAddress.mockResolvedValue(true);

    expect(await validateAddress("ethereum", "0xabc")).toEqual({ valid: true });
    expect(ethereum.coinModule.validateAddress).toHaveBeenCalledWith(ethereum.context, "0xabc", {
      currencyId: "ethereum",
    });
  });

  it("validates an address with the parameters sent", async () => {
    const { ethereum, validateAddress } = setUp();
    ethereum.coinModule.validateAddress.mockResolvedValue(false);

    expect(await validateAddress("ethereum", "0xabc", { networkId: 56 })).toEqual({
      valid: false,
    });
    expect(ethereum.coinModule.validateAddress).toHaveBeenCalledWith(ethereum.context, "0xabc", {
      currencyId: "ethereum",
      networkId: 56,
    });
  });

  it("returns the next sequence as a decimal string", async () => {
    const { ethereum, getNextSequence } = setUp();
    ethereum.coinModule.getNextSequence.mockResolvedValue(42n);

    expect(await getNextSequence("ethereum", "0xabc")).toEqual({ value: "42" });
    expect(ethereum.coinModule.getNextSequence).toHaveBeenCalledWith(ethereum.context, "0xabc");
  });

  it("answers the next sequence unsupported when the coin module has none", async () => {
    const { ethereum, getNextSequence } = setUp();
    ethereum.coinModule.supports = jest.fn(() => false);

    await expect(getNextSequence("ethereum", "0xabc")).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", "getNextSequence is not supported on ethereum"),
    );
    expect(ethereum.coinModule.getNextSequence).not.toHaveBeenCalled();
  });

  describe("getAccountInfo", () => {
    it("answers the coin module's account info, in JSON form", async () => {
      const { ethereum, getAccountInfo } = setUp();
      ethereum.coinModule.getAccountInfo = jest.fn(async () => ({
        type: "tron",
        energy: 5n,
        frozenAt: new Date("2026-01-01T00:00:00.000Z"),
        delegated: undefined,
      }));

      expect(await getAccountInfo("ethereum", "0xabc")).toEqual({
        type: "tron",
        energy: "5",
        frozenAt: "2026-01-01T00:00:00.000Z",
      });
      expect(ethereum.coinModule.getAccountInfo).toHaveBeenCalledWith(ethereum.context, "0xabc");
    });

    it("answers none when the coin module reports nothing more", async () => {
      const { getAccountInfo } = setUp();

      expect(await getAccountInfo("ethereum", "0xabc")).toEqual({ type: "none" });
    });
  });

  describe("call", () => {
    it("runs the coin module's read-only call, answering its result in JSON form", async () => {
      const { ethereum, call } = setUp();
      ethereum.coinModule.call.mockResolvedValue({ value: 3n });
      const params = { to: "0xcontract", data: "0x01" };

      expect(await call("ethereum", { params })).toEqual({ result: { value: "3" } });
      expect(ethereum.coinModule.call).toHaveBeenCalledWith(ethereum.context, params);
    });

    it("answers unsupported when the coin module has no call", async () => {
      const { ethereum, call } = setUp();
      ethereum.coinModule.supports = jest.fn((method: string) => method !== "call");

      await expect(call("ethereum", { params: [] })).rejects.toThrow(
        new PortfolioApiError("METHOD_NOT_ALLOWED", "call is not supported on ethereum"),
      );
    });
  });

  describe("getAddressesForPublicKey", () => {
    it("answers the addresses the coin module finds for the key", async () => {
      const { ethereum, getAddressesForPublicKey } = setUp();
      ethereum.coinModule.getAddressesForPublicKey = jest.fn(async () => ["0.0.1", "0.0.2"]);

      expect(await getAddressesForPublicKey("ethereum", "pubkey")).toEqual({
        addresses: ["0.0.1", "0.0.2"],
      });
      expect(ethereum.coinModule.getAddressesForPublicKey).toHaveBeenCalledWith(
        ethereum.context,
        "pubkey",
      );
    });

    it("answers unsupported on a network that hands out no addresses", async () => {
      const { getAddressesForPublicKey } = setUp();

      await expect(getAddressesForPublicKey("ethereum", "pubkey")).rejects.toThrow(
        new PortfolioApiError("METHOD_NOT_ALLOWED", "ethereum hands out no addresses"),
      );
    });
  });

  describe("getTransactionInfo", () => {
    it("answers what the coin module knows of the transaction, in JSON form", async () => {
      const { ethereum, getTransactionInfo } = setUp();
      ethereum.coinModule.getTransactionInfo = jest.fn(async () => ({
        hash: "0xhash",
        block: { height: 10, hash: "0xblock", time: new Date("2026-01-01T00:00:00.000Z") },
        fee: 21n,
        sequence: 4n,
      }));

      expect(await getTransactionInfo("ethereum", "0xhash")).toEqual({
        hash: "0xhash",
        block: { height: 10, hash: "0xblock", time: "2026-01-01T00:00:00.000Z" },
        fee: "21",
        sequence: "4",
      });
      expect(ethereum.coinModule.getTransactionInfo).toHaveBeenCalledWith(
        ethereum.context,
        "0xhash",
      );
    });

    it("answers undefined when the network does not know the transaction", async () => {
      const { ethereum, getTransactionInfo } = setUp();
      ethereum.coinModule.getTransactionInfo = jest.fn(async () => undefined);

      expect(await getTransactionInfo("ethereum", "0xhash")).toBeUndefined();
    });

    it("answers unsupported when the coin module looks up no transaction", async () => {
      const { getTransactionInfo } = setUp();

      await expect(getTransactionInfo("ethereum", "0xhash")).rejects.toThrow(
        new PortfolioApiError("METHOD_NOT_ALLOWED", "ethereum looks up no transaction"),
      );
    });
  });

  it("rejects a network not served locally as a bad request", async () => {
    const endpoints = setUp();
    const badRequest = new PortfolioApiError("BAD_REQUEST", "Network solana is not served locally");

    await expect(endpoints.getLastBlock("solana")).rejects.toThrow(badRequest);
    await expect(endpoints.getValidators("solana")).rejects.toThrow(badRequest);
    await expect(endpoints.validateAddress("solana", "sol")).rejects.toThrow(badRequest);
    await expect(endpoints.getNextSequence("solana", "sol")).rejects.toThrow(badRequest);
    await expect(endpoints.getAccountInfo("solana", "sol")).rejects.toThrow(badRequest);
    await expect(endpoints.call("solana", { params: {} })).rejects.toThrow(badRequest);
    await expect(endpoints.getAddressesForPublicKey("solana", "key")).rejects.toThrow(badRequest);
    await expect(endpoints.getTransactionInfo("solana", "hash")).rejects.toThrow(badRequest);
  });
});
