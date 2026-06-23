import { TESTNET } from "./helpers";
import { computePolicyId, mintToken } from "./mintToken";
import { buildSigner } from "./signer";
import { killYaci, pollUtxos, spawnYaci, topup } from "./yaci";

jest.setTimeout(600_000);

const PATH = "1852'/1815'/0'/0/0";
const ASSET_NAME_HEX = "4d59544f4b454e";

describe("mintToken (Yaci devnet)", () => {
  it("mints a native token to the account and it shows up in its UTXOs", async () => {
    await spawnYaci();
    try {
      const signer = await buildSigner();
      const { address } = await signer.getAddress(PATH, TESTNET.networkId);

      await topup(address, 10_000);
      await pollUtxos(address, u =>
        u.some(x => x.amount.length === 1 && x.amount[0].unit === "lovelace"),
      );

      const policyId = computePolicyId(address);
      const assetRef = await mintToken({
        address,
        derivationPath: PATH,
        signer,
        networkId: TESTNET.networkId,
        currencyId: "cardano_testnet",
        assetNameHex: ASSET_NAME_HEX,
        amount: 1_000n,
      });
      expect(assetRef).toBe(`${policyId}${ASSET_NAME_HEX}`);

      // The minted token's unit is policyId + assetNameHex (Blockfrost concatenation).
      const unit = `${policyId}${ASSET_NAME_HEX}`;
      const utxos = await pollUtxos(address, u =>
        u.some(x => x.amount.some(a => a.unit === unit && a.quantity === "1000")),
      );
      expect(utxos.some(x => x.amount.some(a => a.unit === unit))).toBe(true);
    } finally {
      await killYaci();
    }
  });
});
