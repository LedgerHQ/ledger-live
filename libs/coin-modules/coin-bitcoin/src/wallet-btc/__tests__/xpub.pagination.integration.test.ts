// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coininfo from "coininfo";
import { DerivationModes } from "../types";
import BitcoinLikeStorage from "../storage";
import BitcoinLikeExplorer from "../explorer";
import Crypto from "../crypto/digibyte";
import Xpub from "../xpub";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { TX } from "../storage/types";

describe("test transactin pagination", () => {
  const xpubraw =
    "xpub6Co7wRMSsree1cGESqdgi4BpcVDgdJfjUWqY8M6Dnh3N1NmphcSwhbRoUA2nitgsJxd7gqhSTbSbXf3uAD4q4FqbCsKSGEpw5ab3DS7TtM2";
  const storage = new BitcoinLikeStorage();
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("digibyte"),
  });
  const crypto = new Crypto({
    network: coininfo.digibyte.main.toBitcoinJS(),
  });
  const xpub = new Xpub({
    storage,
    explorer,
    crypto,
    xpub: xpubraw,
    derivationMode: DerivationModes.SEGWIT,
  });

  beforeAll(async () => {
    await xpub.sync();
  }, 120000);
  it("should fetch transaction correctly when there are multiple pages", async () => {
    let txs = (xpub.storage as any).txs as TX[];
    txs = txs.filter(tx => tx.address === "SXsfhxNuq2eUZMRrNXrCvuaFcGSJKhMvzj"); // this address has more than 2000 txs
    expect(txs.length).toBeGreaterThan(2000);
  });
});
