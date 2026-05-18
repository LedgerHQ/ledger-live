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
});
