import coininfo from "coininfo";
import { script } from "bitcoinjs-lib";

import BTCCrypto from "../crypto/bitcoin";
import BTCCashCrypto from "../crypto/bitcoincash";
import DogeCrypto from "../crypto/doge";
import ZECCrypto from "../crypto/zec";
import ZENCrypto from "../crypto/zen";

describe("Transaction Output script", () => {
  const btcCrypto = new BTCCrypto({
    network: coininfo.bitcoin.main.toBitcoinJS(),
  });

  const zecCrypto = new ZECCrypto({
    network: coininfo.zcash.main.toBitcoinJS(),
  });

  const zenCrypto = new ZENCrypto({
    network: coininfo.zcash.main.toBitcoinJS(),
  });

  const btcCashCrypto = new BTCCashCrypto({
    network: coininfo.bitcoincash.main.toBitcoinJS(),
  });

  const dogeCrypto = new DogeCrypto({
    network: coininfo.dogecoin.main.toBitcoinJS(),
  });

  it("Test toOutputScript for btc, zcash and zen", () => {
    expect(btcCrypto.toOutputScript("1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX").toString("hex")).toEqual(
      "76a91499bc78ba577a95a11f1a344d4d2ae55f2f857b9888ac",
    );
    // Legacy zcash address
    expect(zecCrypto.toOutputScript("t1T5XJvzQhh2gTsi3c5Vn9x5SMhpSWLSnVy").toString("hex")).toEqual(
      "76a91464fa33fb6f8d72455af2a4e73ae30412af2c97ba88ac",
    );
    // P2SH zcash address
    expect(zecCrypto.toOutputScript("t3PU1j7YW3fJ67jUbkGhSRto8qK2qXCUiW3").toString("hex")).toEqual(
      "a91435c929cb2ee32626e1f5c8d773ab4fe9d94686e087",
    );
    // Legacy zen address
    expect(zenCrypto.toOutputScript("znjbHth4PxBJM8FmHgvXYHkuq99nKFkWvMg").toString("hex")).toEqual(
      "76a914cb009bf12fc17d28e61527951101fdabfeaa187288ac209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4",
    );
    // P2SH zen address
    expect(zenCrypto.toOutputScript("zszpcLB6C5B8QvfDbF2dYWXsrpac5DL9WRk").toString("hex")).toEqual(
      "a914df23c5eaba30b4d95798c5d5d0e2ecc2a3dc4ff287209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4",
    );
  }, 30000);

  it("should get correct output script for OP_RETURN opcode", () => {
    [btcCrypto, btcCashCrypto, dogeCrypto].forEach(coin => {
      const data = Buffer.from("charley loves heidi", "utf-8");

      const output = coin.toOpReturnOutputScript(data);
      const [opType, message] = script.decompile(output) as [number, Buffer];

      expect(output.toString("hex")).toEqual("6a13636861726c6579206c6f766573206865696469");

      expect(opType).toEqual(script.OPS.OP_RETURN);
      expect(message.toString()).toEqual("charley loves heidi");
    });
  });
});
