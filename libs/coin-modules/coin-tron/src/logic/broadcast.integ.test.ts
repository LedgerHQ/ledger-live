import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { tronDefaults, type TronCoinConfig } from "../config";
import { TronWeb } from "tronweb";
import { broadcast } from "./broadcast";

const mockLogger: Logger = jest.fn();

const mockConfig = tronDefaults.tron as TronCoinConfig;

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const tronWeb = new TronWeb({
      fullHost: tronDefaults.tron.explorer.url,
    });
    const sender = tronWeb.utils.accounts.generateAccount();
    const receiver = tronWeb.utils.accounts.generateAccount();
    const tx = await tronWeb.transactionBuilder.sendTrx(
      receiver.address.base58,
      1,
      sender.address.base58,
    );
    const signed = await tronWeb.trx.sign(tx, sender.privateKey);

    await expect(broadcast(mockLogger, mockConfig, signed)).rejects.toThrow(
      /CONTRACT_VALIDATE_ERROR/,
    );
  });
});
