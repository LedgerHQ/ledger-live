import BigNumber from "bignumber.js";
import IconService, { SignedTransaction, Wallet } from "icon-sdk-js";
import { broadcast } from "./broadcast";
import { MAINNET_NID, RPC_VERSION } from "./constants";
import { iconDefaults, setCoinConfig } from "./config";
const { IconBuilder, IconConverter, IconAmount } = IconService;

describe("broadcast (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      ...iconDefaults.icon,
      infra: {
        indexer: "https://icon.coin.ledger.com/api/v1",
        indexer_testnet: "https://tracker.berlin.icon.community/api/v1",
        node_endpoint: "https://icon.coin.ledger.com/api/v3",
        node_testnet_endpoint: "https://berlin.net.solidwallet.io/api/v3",
        debug_endpoint: "https://icon.coin.ledger.com/api/v3d",
        debug_testnet_endpoint: "https://berlin.net.solidwallet.io/api/v3d",
      },
    }));
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
