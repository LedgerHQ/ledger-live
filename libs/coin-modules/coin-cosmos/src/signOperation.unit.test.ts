import { makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import { Secp256k1, sha256 } from "@cosmjs/crypto";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import { messageParamsFromTransaction, txToMessages } from "./buildTransaction";
import cryptoFactory from "./chain/chain";
import { ExpertModeRequired } from "./errors";
import { buildSignOperation } from "./signOperation";
import { CosmosAccount, RETURN_CODES, Transaction } from "./types";
import { CosmosSigner } from "./types/signer";

// signOperation constructs `new CosmosAPI(account.currency.id)` internally, so the network
// layer must be mocked rather than injected — unlike signRawOperation, which only takes a
// signerContext.
jest.mock("./network/Cosmos", () => ({
  CosmosAPI: jest.fn().mockImplementation(() => ({
    getAccount: jest.fn().mockResolvedValue({
      accountNumber: 7,
      sequence: 3,
      pubKey: "",
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
    }),
    getNodeInfo: jest.fn().mockResolvedValue({
      default_node_info: { network: "gonka-mainnet" },
    }),
  })),
}));

const SUCCESS = 0x9000;
const ACCOUNT_NUMBER = "7";
const SEQUENCE = "3";
const CHAIN_ID = "gonka-mainnet";

const privkey = sha256(Buffer.from("coin-cosmos signOperation test seed"));
// Arbitrary but well-formed compressed secp256k1 pubkey bytes — signOperation only forwards
// this into the crafted transaction, it never validates it, so the exact value is irrelevant.
const compressedPk = Buffer.from(`02${"11".repeat(32)}`, "hex");

// Signer that produces a real DER secp256k1 signature over the bytes it receives, so
// `Secp256k1Signature.fromDer` in signOperation.ts never throws on a fixture signature.
function makeRealSigner(): CosmosSigner & { sign: jest.Mock; getAddressAndPubKey: jest.Mock } {
  const getAddressAndPubKey = jest.fn().mockResolvedValue({
    bech32_address: "",
    compressed_pk: compressedPk,
    return_code: SUCCESS,
    error_message: "",
  });
  const sign = jest.fn(async (_path: number[], buffer: Buffer) => {
    const sig = await Secp256k1.createSignature(sha256(buffer), privkey);
    return { signature: Buffer.from(sig.toDer()), return_code: SUCCESS };
  });
  return { getAddressAndPubKey, sign } as unknown as CosmosSigner & {
    sign: jest.Mock;
    getAddressAndPubKey: jest.Mock;
  };
}

const signerContextOf =
  (signer: CosmosSigner) => (_deviceId: string, fn: (s: CosmosSigner) => any) =>
    fn(signer);

function makeAccount(
  freshAddressPath: string,
  currency: { id: string; units: { code: string }[] },
): CosmosAccount {
  return {
    id: "js:2:cosmos:cosmos1xxx:",
    freshAddress: "cosmos1xxx",
    freshAddressPath,
    spendableBalance: new BigNumber(0),
    currency,
  } as unknown as CosmosAccount;
}

function makeTransaction(recipient: string): Transaction {
  return {
    family: "cosmos",
    mode: "send",
    recipient,
    amount: new BigNumber(1000),
    fees: new BigNumber(500),
    gas: new BigNumber(200000),
    memo: "",
    validators: [],
    sourceValidator: undefined,
    networkInfo: null,
    useAllAmount: false,
  } as unknown as Transaction;
}

// Rebuilds the exact signDoc bytes signOperation.ts should hand to the device, independently
// of the module under test, so the "canonical bytes" assertion is not circular.
function expectedSignDocBytes(account: CosmosAccount, transaction: Transaction): Buffer {
  const chainInstance = cryptoFactory(account.currency.id);
  const { aminoMsgs } = txToMessages(
    messageParamsFromTransaction(account, transaction),
    chainInstance,
  );
  const feeToEncode = {
    amount: [
      {
        denom: account.currency.units[1].code,
        amount: transaction.fees!.toFixed(),
      },
    ],
    gas: transaction.gas!.toFixed(),
  };
  const signDoc = makeSignDoc(
    aminoMsgs,
    feeToEncode,
    CHAIN_ID,
    transaction.memo || "",
    ACCOUNT_NUMBER,
    SEQUENCE,
  );
  return Buffer.from(serializeSignDoc(signDoc));
}

describe("buildSignOperation", () => {
  it("passes the chain prefix for coin type 1200 and signs the canonical signDoc bytes", async () => {
    const signer = makeRealSigner();
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/1200'/0'/0/0", {
      id: "gonka",
      units: [{ code: "GNK" }, { code: "ngonka" }],
    });
    const transaction = makeTransaction("gonka1yyy");

    const events = await firstValueFrom(
      signOperation({ account, deviceId: "mock", transaction }).pipe(toArray()),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    // The chain prefix reaches the device as the 3rd sign argument — coin type 1200 is neither
    // 60 nor 118, the two coin types the old gate special-cased.
    expect(signer.sign.mock.calls[0][2]).toBe("gonka");
    // The device signs the canonical serialized amino signDoc, not some other buffer — guards
    // against the prefix landing in the wrong positional slot.
    expect(Buffer.from(signer.sign.mock.calls[0][1])).toEqual(
      expectedSignDocBytes(account, transaction),
    );
  });

  it("passes the chain prefix for coin type 118 (existing chains, pinned)", async () => {
    const signer = makeRealSigner();
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/118'/0'/0/0", {
      id: "cosmos",
      units: [{ code: "ATOM" }, { code: "uatom" }],
    });
    const transaction = makeTransaction("cosmos1yyy");

    await firstValueFrom(signOperation({ account, deviceId: "mock", transaction }).pipe(toArray()));

    // The argument changes for existing chains too — this pins the new value so a regression
    // to the coin-type gate is caught.
    expect(signer.sign.mock.calls[0][2]).toBe("cosmos");
  });

  it("omits the prefix for crypto_org, whose device app is not app-cosmos", async () => {
    const signer = makeRealSigner();
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/394'/0'/0/0", {
      id: "crypto_org",
      units: [{ code: "CRO" }, { code: "basecro" }],
    });
    const transaction = makeTransaction("cro1yyy");

    await firstValueFrom(signOperation({ account, deviceId: "mock", transaction }).pipe(toArray()));

    // Coin type 394 is served by the "Cronos POS Chain" app, which app-cosmos's chain config
    // does not cover and whose sign-APDU handling of the field is unverified. Omitting it keeps
    // the APDU framing that app has always received.
    expect(signer.sign.mock.calls[0][2]).toBeUndefined();
    // Address derivation is unaffected — it has always sent the prefix.
    expect(signer.getAddressAndPubKey.mock.calls[0][1]).toBe("cro");
  });

  it("omits the prefix for crypto_org_croeseid, which reuses crypto_org's params", async () => {
    const signer = makeRealSigner();
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/394'/0'/0/0", {
      id: "crypto_org_croeseid",
      units: [{ code: "CRO" }, { code: "basecro" }],
    });
    const transaction = makeTransaction("cro1yyy");

    await firstValueFrom(signOperation({ account, deviceId: "mock", transaction }).pipe(toArray()));

    expect(signer.sign.mock.calls[0][2]).toBeUndefined();
  });

  it("throws ExpertModeRequired when the device demands expert mode", async () => {
    const signer = makeRealSigner();
    signer.sign.mockResolvedValue({
      signature: null,
      return_code: RETURN_CODES.EXPERT_MODE_REQUIRED,
    });
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/1200'/0'/0/0", {
      id: "gonka",
      units: [{ code: "GNK" }, { code: "ngonka" }],
    });

    await expect(
      firstValueFrom(
        signOperation({
          account,
          deviceId: "mock",
          transaction: makeTransaction("gonka1yyy"),
        }).pipe(toArray()),
      ),
    ).rejects.toBeInstanceOf(ExpertModeRequired);
  });

  it("throws a clear error when the device returns no signature on an unhandled return_code", async () => {
    const signer = makeRealSigner();
    // 0x698C is APDU_CODE_CHAIN_CONFIG_NOT_SUPPORTED — the status word the device answers for an
    // unrecognised (coin type, HRP) pair. It is mapped nowhere in the monorepo, so without this
    // guard it would surface as a DER parse failure on a null signature.
    signer.sign.mockResolvedValue({ signature: null, return_code: 0x698c });
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/1200'/0'/0/0", {
      id: "gonka",
      units: [{ code: "GNK" }, { code: "ngonka" }],
    });

    await expect(
      firstValueFrom(
        signOperation({
          account,
          deviceId: "mock",
          transaction: makeTransaction("gonka1yyy"),
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("device returned no signature");
    expect(signer.sign).toHaveBeenCalledTimes(1);
  });

  it("throws UserRefusedOnDevice when the user rejects on device", async () => {
    const signer = makeRealSigner();
    signer.sign.mockResolvedValue({ signature: null, return_code: RETURN_CODES.REFUSED_OPERATION });
    const signOperation = buildSignOperation(signerContextOf(signer));
    const account = makeAccount("44'/1200'/0'/0/0", {
      id: "gonka",
      units: [{ code: "GNK" }, { code: "ngonka" }],
    });

    await expect(
      firstValueFrom(
        signOperation({
          account,
          deviceId: "mock",
          transaction: makeTransaction("gonka1yyy"),
        }).pipe(toArray()),
      ),
    ).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });
});
