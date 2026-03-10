import { Keypair } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { getBalance } from "../getBalance";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const FUNDED_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const UNFUNDED_ADDRESS = Keypair.generate().publicKey.toBase58();

describe("getBalance (integration)", () => {
  it("returns native balance for a funded account", async () => {
    const balances = await getBalance(api, FUNDED_ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBeGreaterThan(0n);
    expect(balances[0].locked).toBeGreaterThan(0n);
  });

  it("returns zero balance for an unfunded account", async () => {
    const balances = await getBalance(api, UNFUNDED_ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBe(0n);
  });
});
