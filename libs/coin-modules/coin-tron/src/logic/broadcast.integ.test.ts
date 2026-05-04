import { TronWeb } from "tronweb";
import { broadcast } from "./broadcast";
import coinConfig from "../config";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
    }));
  });

  it("throws on insufficient funds", async () => {
    const tronWeb = new TronWeb({
      fullHost: "https://tron.coin.ledger.com",
    });
    const sender = tronWeb.utils.accounts.generateAccount();
    const receiver = tronWeb.utils.accounts.generateAccount();
    const tx = await tronWeb.transactionBuilder.sendTrx(
      receiver.address.base58,
      1,
      sender.address.base58,
    );
    const signed = await tronWeb.trx.sign(tx, sender.privateKey);

    await expect(broadcast(signed)).rejects.toThrow(/CONTRACT_VALIDATE_ERROR/);
  });
});
