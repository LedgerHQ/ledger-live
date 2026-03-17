import { getChainAPI } from "../../network";
import { endpointByCurrencyId } from "../../utils";
import { getNextSequence } from "../getNextSequence";

const api = getChainAPI({ endpoint: endpointByCurrencyId("solana") });

describe("getNextSequence (real RPC)", () => {
  it("should return a positive slot number", async () => {
    const result = await getNextSequence(api, "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE");

    expect(result).toBeGreaterThan(0n);
  });
});
