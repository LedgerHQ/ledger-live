import { BigNumber } from "bignumber.js";
import IconService, { SignedTransaction, Wallet } from "icon-sdk-js";
import { broadcast } from "./broadcast";
import { MAINNET_NID, RPC_VERSION } from "./constants";
import { setCoinConfig } from "./config";
const { IconBuilder, IconConverter, IconAmount } = IconService;

describe("broadcast (integration)", () => {
  beforeAll(() => {
    setCoinConfig(
      () =>
        ({
          status: { type: "active", features: [] },
          infra: {
            node_endpoint: "https://icon.coin.ledger.com/api/v3",
          },
        }) as any,
    );
  });

  it("rejects a valid signed tx when the sender cannot pay fees or value", async () => {
    const wallet = Wallet.create();
    const from = wallet.getAddress();
    const valueLoop = new BigNumber(IconAmount.toLoop("1", IconAmount.Unit.ICX.toString()));
    const stepLimit = new BigNumber(200_000);
    const unsigned = new IconBuilder.IcxTransactionBuilder()
      .from(from)
      .to(from)
      .value(IconConverter.toHexNumber(valueLoop))
      .nid(IconConverter.toHexNumber(MAINNET_NID))
      .nonce(IconConverter.toHexNumber(0))
      .timestamp(IconConverter.toHexNumber(Date.now() * 1000))
      .version(IconConverter.toHexNumber(RPC_VERSION))
      .stepLimit(IconConverter.toHexNumber(stepLimit))
      .build();
    const signed = new SignedTransaction(unsigned as any, wallet);

    await expect(
      broadcast({
        account: { currency: { id: "icon" }, freshAddress: from } as any,
        signedOperation: {
          signature: signed.getSignature(),
          rawData: signed.getProperties(),
        },
      } as any),
    ).rejects.toThrow(/OutOfBalance/);
  });
});
