import {
  CasperNetwork,
  KeyAlgorithm,
  PrivateKey,
  PublicKey,
  Transaction as CasperDeployTransaction,
} from "casper-js-sdk";
import {
  casperMainnetConfig,
  casperMainnetResolvedConfig,
} from "../__tests__/fixtures/config.fixture";
import { getCasperNodeRpcClient } from "../network/api";
import { setCoinConfig } from "../config";
import { CASPER_DEFAULT_TTL, CASPER_FEES_MOTES, CASPER_NETWORK } from "../constants";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(casperMainnetConfig);
  });

  it("throws on insufficient funds", async () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const senderHex = privateKey.publicKey.toHex();

    const casperNetwork = await CasperNetwork.create(
      getCasperNodeRpcClient(casperMainnetResolvedConfig),
    );
    const deploy: CasperDeployTransaction = casperNetwork.createTransferTransaction(
      PublicKey.fromHex(senderHex),
      PublicKey.fromHex(senderHex),
      CASPER_NETWORK,
      "1",
      CASPER_FEES_MOTES,
      CASPER_DEFAULT_TTL,
      0,
    );

    // Matches TransactionV1.sign()/validate(): the signed message is the transaction hash,
    // not the serialized transaction bytes.
    const signatureHex = Buffer.from(
      privateKey.signAndAddAlgorithmBytes(new Uint8Array(deploy.hash.toBytes())),
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
