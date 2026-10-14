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
        { address: "0xv1", name: "Validator", balance: "32", commissionRate: "5", apy: 0.04 },
      ],
      next: "page-2",
    });
    expect(await getValidators("ethereum", { cursor: "page-2" })).toEqual({ items: [] });
    expect(ethereum.coinModule.getValidators).toHaveBeenLastCalledWith(ethereum.context, {
      cursor: "page-2",
    });
  });

  it("validates an address for the network currency", async () => {
    const { ethereum, validateAddress } = setUp();
    ethereum.coinModule.validateAddress.mockResolvedValue(true);

    expect(await validateAddress("ethereum", "0xabc")).toEqual({ valid: true });
    expect(ethereum.coinModule.validateAddress).toHaveBeenCalledWith(ethereum.context, "0xabc", {
      currencyId: "ethereum",
    });
  });

  it("returns the next sequence as a decimal string", async () => {
    const { ethereum, getNextSequence } = setUp();
    ethereum.coinModule.getNextSequence.mockResolvedValue(42n);

    expect(await getNextSequence("ethereum", "0xabc")).toEqual({ value: "42" });
    expect(ethereum.coinModule.getNextSequence).toHaveBeenCalledWith(ethereum.context, "0xabc");
  });

  it("rejects a network not served locally as a bad request", async () => {
    const { getLastBlock, getValidators, validateAddress, getNextSequence } = setUp();
    const badRequest = new PortfolioApiError("BAD_REQUEST", "Network solana is not served locally");

    await expect(getLastBlock("solana")).rejects.toThrow(badRequest);
    await expect(getValidators("solana")).rejects.toThrow(badRequest);
    await expect(validateAddress("solana", "sol")).rejects.toThrow(badRequest);
    await expect(getNextSequence("solana", "sol")).rejects.toThrow(badRequest);
  });
});
