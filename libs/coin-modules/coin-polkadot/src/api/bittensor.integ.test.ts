import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";

// Bittensor integration tests run only when a local Sidecar instance is available.
// To run:
//   SAS_SUBSTRATE_URL=wss://entrypoint-finney.opentensor.ai:443 npx @substrate/api-sidecar
//   API_BITTENSOR_SIDECAR=http://127.0.0.1:8080 pnpm test-integ
const bittensorSidecarUrl = process.env.API_BITTENSOR_SIDECAR;
const describeBittensor = bittensorSidecarUrl ? describe : describe.skip;

describeBittensor("Bittensor Api", () => {
  let module: CoinModuleApi;

  // A Bittensor address (SS58 prefix 42) with a non-zero balance on finney mainnet.
  const fundedAddress = "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM";
  // Alice dev address — zero TAO on finney mainnet (never received funds).
  const pristineAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

  beforeAll(() => {
    module = createApi({
      node: { url: process.env.API_BITTENSOR_NODE || "" },
      sidecar: { url: bittensorSidecarUrl! },
      indexer: { url: process.env.API_BITTENSOR_INDEXER || "" },
      staking: { electionStatusThreshold: 25 },
    });
  });

  describe("getBalance", () => {
    it("should return native balance for a funded Bittensor address", async () => {
      const result = await module.getBalance(fundedAddress);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThan(0);
    }, 10000);

    it("should return zero balance for a pristine Bittensor address", async () => {
      const result = await module.getBalance(pristineAddress);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBe(BigInt(0));
    }, 10000);
  });

  describe("lastBlock", () => {
    it("should return last block info", async () => {
      const result = await module.lastBlock();
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    }, 10000);
  });

  describe("getBlockInfo", () => {
    it("should return block info for a specific height", async () => {
      const lastBlockResult = await module.lastBlock();
      const result = await module.getBlockInfo(lastBlockResult.height);
      expect(result.height).toBe(lastBlockResult.height);
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    }, 10000);
  });

  describe("getBlock", () => {
    it("should return block with transactions for a specific height", async () => {
      const lastBlockResult = await module.lastBlock();
      const result = await module.getBlock(lastBlockResult.height);
      expect(result.info.height).toBe(lastBlockResult.height);
      expect(result.info.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(Array.isArray(result.transactions)).toBe(true);
      for (const tx of result.transactions) {
        expect(tx.hash).toMatch(/^0x[a-fA-F0-9]+$/);
        expect(typeof tx.fees).toBe("bigint");
        expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
      }
    }, 15000);
  });

  describe("estimateFees", () => {
    it("should return a fee estimate > 0 for a Bittensor transfer", async () => {
      const { value } = await module.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: fundedAddress,
        recipient: pristineAddress,
        amount: BigInt(100),
      });
      expect(value).toBeGreaterThanOrEqual(BigInt(1));
    }, 10000);
  });

  describe("craftTransaction", () => {
    it("should return a SCALE-encoded unsigned transaction", async () => {
      const result = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: fundedAddress,
        recipient: pristineAddress,
        amount: BigInt(100),
      });
      expect(result.transaction).toMatch(/^0x[a-fA-F0-9]+$/);
    }, 10000);
  });
});
