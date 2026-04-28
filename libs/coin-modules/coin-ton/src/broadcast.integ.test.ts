import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { internal, toNano, Address, beginCell, external, storeMessage } from "@ton/core";
import broadcast from "./broadcast";
import { setCoinConfig } from "./config";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(
      () =>
        ({
          status: { type: "active" },
          infra: {
            API_TON_ENDPOINT: "https://ton.coin.ledger.com/api/v3",
          },
        }) as any,
    );
  });

  it("throws on not deployed and empty account", async () => {
    const mnemonic = await mnemonicNew();
    const { publicKey, secretKey } = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey });
    const msg = internal({
      to: Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"),
      value: toNano("0.01"),
      bounce: false,
      body: beginCell().endCell(),
    });
    const body = wallet.createTransfer({
      seqno: 0,
      secretKey,
      messages: [msg],
    });
    const ext = external({
      to: wallet.address,
      init: null,
      body,
    });
    const cell = beginCell().store(storeMessage(ext)).endCell();
    const base64 = Buffer.from(cell.toBoc()).toString("base64");

    await expect(broadcast({ signedOperation: { signature: base64 } } as any)).rejects.toThrow(
      /Failed to unpack account state/,
    );
  });
});
