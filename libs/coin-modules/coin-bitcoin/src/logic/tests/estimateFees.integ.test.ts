import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../../config";
import { estimateFees } from "../estimateFees";
import { FUNDED_P2WPKH, PRISTINE_P2PKH, PRISTINE_P2WPKH } from "./helpers/fixtures";

const context: BitcoinContext = {
  config: async () => ({
    status: { type: "active" },
    name: "Bitcoin",
    unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

const intent = (overrides: Partial<TransactionIntent> = {}): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender: FUNDED_P2WPKH,
  recipient: PRISTINE_P2PKH,
  amount: 1_000n,
  asset: { type: "native" },
  ...overrides,
});

describe("estimateFees (mainnet)", () => {
  it("estimates a send from a funded address", async () => {
    const estimation = await estimateFees(context, "bitcoin", intent());
    expect(estimation.value).toBeGreaterThan(0n);
    expect(estimation.parameters?.feePerByte as bigint).toBeGreaterThan(0n);
    expect(estimation.parameters?.inputCount).toBe(1);
  });

  it("estimates a send-max from a funded address", async () => {
    const estimation = await estimateFees(context, "bitcoin", intent({ useAllAmount: true }));
    expect(estimation.value).toBeGreaterThan(0n);
    expect(estimation.parameters?.change).toBe(0n);
  });

  it("estimates a send from an address without outputs", async () => {
    const estimation = await estimateFees(context, "bitcoin", intent({ sender: PRISTINE_P2WPKH }));
    expect(estimation.value).toBeGreaterThan(0n);
    expect(estimation.parameters?.sufficient).toBe(false);
  });
});
