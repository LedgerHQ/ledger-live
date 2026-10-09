import { lastValueFrom, of } from "rxjs";
import { toArray } from "rxjs/operators";
import { genericSignRawOperation } from "../signRawOperation";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import { buildSignRawOperation } from "@ledgerhq/coin-cosmos/signRawOperation";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(),
}));

describe("genericSignRawOperation", () => {
  const account = {
    id: "js:2:ripple:rTestAddress:",
    freshAddressPath: "44'/144'/0'/0/0",
    freshAddress: "rTestAddress",
    currency: { id: "ripple", family: "xrp", units: [{ code: "XRP" }] },
  } as any;

  const craftRawTransaction = jest.fn().mockResolvedValue({ transaction: "unsignedTx" });
  const combine = jest.fn().mockResolvedValue("signedTx");
  const signer = {
    getAddress: jest.fn().mockResolvedValue({ publicKey: "pubKey" }),
    signTransaction: jest.fn().mockResolvedValue("sig"),
  };
  const signerContext = jest.fn(async (_deviceId, cb) => cb(signer));

  beforeEach(() => {
    jest.clearAllMocks();
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      craftRawTransaction,
      combine,
      getNextSequence: jest.fn().mockResolvedValue(1n),
    });
  });

  it("should craft, sign and combine the raw transaction", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({});

    const events = await lastValueFrom(
      genericSignRawOperation(
        "ripple",
        "local",
      )(signerContext)({
        account,
        transaction: "rawTx",
        deviceId: "",
      }).pipe(toArray()),
    );

    expect(craftRawTransaction).toHaveBeenCalledWith(
      expect.anything(),
      "rawTx",
      "rTestAddress",
      "pubKey",
      1n,
    );
    expect(combine).toHaveBeenCalledWith(expect.anything(), "unsignedTx", ["sig"], {
      pubkey: "pubKey",
    });
    const signed = events.find(e => e.type === "signed");
    expect(signed).toMatchObject({ signedOperation: { signature: "signedTx" } });
  });

  it("should hand the request to the family's signRawOperation when present", async () => {
    const signed = { type: "signed", signedOperation: { signature: "detached" } };
    const signRawOperation = jest.fn().mockReturnValue(of(signed));
    (getBridgeApi as jest.Mock).mockResolvedValue({ signRawOperation });

    const events = await lastValueFrom(
      genericSignRawOperation(
        "ripple",
        "local",
      )(signerContext)({ account, transaction: "rawTx", deviceId: "d" }).pipe(toArray()),
    );

    expect(signRawOperation).toHaveBeenCalledWith({ account, transaction: "rawTx", deviceId: "d" });
    expect(events).toEqual([signed]);
    expect(getCoinModuleApi).not.toHaveBeenCalled();
    expect(signerContext).not.toHaveBeenCalled();
  });
  describe("cosmos", () => {
    // A 32-byte r and s, DER-encoded; the signature handed back is their fixed-length hex.
    const r = Buffer.alloc(32, 0x11);
    const s = Buffer.alloc(32, 0x22);
    const der = Buffer.concat([
      Buffer.from([0x30, 0x44, 0x02, 0x20]),
      r,
      Buffer.from([0x02, 0x20]),
      s,
    ]);
    const signDoc = JSON.stringify({
      account_number: "7",
      chain_id: "cosmoshub-4",
      fee: { amount: [{ amount: "5000", denom: "uatom" }], gas: "200000" },
      memo: "",
      msgs: [
        {
          type: "cosmos-sdk/MsgSend",
          value: {
            amount: [{ amount: "1000", denom: "uatom" }],
            from_address: "cosmos1sender",
            to_address: "cosmos1recipient",
          },
        },
      ],
      sequence: "3",
    });
    const cosmosAccount = {
      id: "js:2:cosmos:cosmos1sender:",
      freshAddressPath: "44'/118'/0'/0/0",
      freshAddress: "cosmos1sender",
      currency: getCryptoCurrencyById("cosmos"),
    } as any;

    it("routes an amino sign doc through the family's signRawOperation and returns the detached signature", async () => {
      const deviceSigner = {
        sign: jest.fn().mockResolvedValue({ signature: der, return_code: 0x9000 }),
      };
      const cosmosSignerContext = jest.fn(async (_deviceId, cb) => cb(deviceSigner));
      (getBridgeApi as jest.Mock).mockResolvedValue({
        signRawOperation: buildSignRawOperation(cosmosSignerContext as any),
      });

      const events = await lastValueFrom(
        genericSignRawOperation(
          "cosmos",
          "local",
        )(signerContext)({ account: cosmosAccount, transaction: signDoc, deviceId: "d" }).pipe(
          toArray(),
        ),
      );

      expect(events.map(e => e.type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      expect(events[2]).toMatchObject({
        signedOperation: { signature: r.toString("hex") + s.toString("hex") },
      });
      // Signed with the account's path and the chain prefix, never through the framework's signer.
      expect(deviceSigner.sign).toHaveBeenCalledWith(
        [44, 118, 0, 0, 0],
        expect.any(Buffer),
        cryptoFactory("cosmos").prefix,
      );
      expect(cryptoFactory("cosmos").prefix).toBe("cosmos");
      expect(signerContext).not.toHaveBeenCalled();
      expect(getCoinModuleApi).not.toHaveBeenCalled();
    });
  });
});
