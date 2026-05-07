import BigNumber from "bignumber.js";
import {
  CasperNetwork,
  KeyAlgorithm,
  PrivateKey,
  PublicKey,
  Transaction as CasperDeployTransaction,
} from "casper-js-sdk";
import { getCasperNodeRpcClient } from "../api";
import { setCoinConfig } from "../config";
import { CASPER_DEFAULT_TTL, CASPER_FEES_MOTES, CASPER_NETWORK } from "../consts";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
        API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
      },
    }));
  });

  it("throws on insufficient funds", async () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const senderHex = privateKey.publicKey.toHex();

    const casperNetwork = await CasperNetwork.create(getCasperNodeRpcClient());
    const feeMotes = new BigNumber(CASPER_FEES_MOTES);
    const deploy: CasperDeployTransaction = casperNetwork.createTransferTransaction(
      PublicKey.fromHex(senderHex),
      PublicKey.fromHex(senderHex),
      CASPER_NETWORK,
      "1",
      feeMotes.toNumber(),
      CASPER_DEFAULT_TTL,
      0,
    );

    const signatureHex = Buffer.from(
      privateKey.signAndAddAlgorithmBytes(new Uint8Array(deploy.toBytes())),
    ).toString("hex");

    await expect(
      broadcast({
        account: { freshAddress: senderHex },
        signedOperation: {
          signature: signatureHex,
          rawData: { tx: JSON.stringify(deploy.toJSON()) },
        },
      } as any),
    ).rejects.toThrow(/Code: -32016, err: Invalid transaction/);
  });
});
