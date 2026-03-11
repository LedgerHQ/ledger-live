import Btc from "@ledgerhq/hw-app-btc";
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerZcash, PubKeyDisplayMode } from "../src/DmkSignerZcash";

describe("DmkSignerZcash", () => {
  let signer: DmkSignerZcash;

  beforeEach(() => {
    jest.clearAllMocks();

    const transportMock = {
      decorateAppAPIMethods: jest.fn(),
    } as unknown as Transport;

    signer = new DmkSignerZcash(transportMock, "zcash");
  });

  it("throws for getViewKey until implemented", () => {
    expect(() => signer.getViewKey("44'/133'/0'/0/0")).toThrow("Not implemented yet");
  });

  it("throws for getAppConfiguration until implemented", () => {
    expect(() => signer.getAppConfiguration()).toThrow("Not implemented yet");
  });

  it("delegates getWalletXpub to Btc", async () => {
    const arg = { path: "44'/133'/0'", xpubVersion: 0x0488b21e };
    const expected = "xpub-test";
    const spy = jest.spyOn(Btc.prototype, "getWalletXpub").mockResolvedValue(expected);

    const result = await signer.getWalletXpub(arg);

    expect(result).toBe(expected);
    expect(spy).toHaveBeenCalledWith(arg);
  });

  it("delegates getWalletPublicKey to Btc", async () => {
    const expected = {
      publicKey: "pubkey",
      bitcoinAddress: "t1abc",
      chainCode: "chaincode",
    };
    const spy = jest.spyOn(Btc.prototype, "getWalletPublicKey").mockResolvedValue(expected);

    const result = await signer.getWalletPublicKey("44'/133'/0'/0/0", {
      verify: true,
      format: "legacy",
    });

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith("44'/133'/0'/0/0", { verify: true, format: "legacy" });
  });

  it("delegates signMessage to Btc", async () => {
    const expected = {
      v: 27,
      r: "r-value",
      s: "s-value",
    };
    const spy = jest.spyOn(Btc.prototype, "signMessage").mockResolvedValue(expected);

    const result = await signer.signMessage("44'/133'/0'/0/0", "deadbeef");

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith("44'/133'/0'/0/0", "deadbeef");
  });

  it("delegates createPaymentTransaction to Btc", async () => {
    const expected = "0200000001...";
    const spy = jest
      .spyOn(Btc.prototype, "createPaymentTransaction")
      .mockResolvedValue(expected);
    const arg = {
      inputs: [],
      associatedKeysets: [],
      outputScriptHex: "00",
    };

    const result = await signer.createPaymentTransaction(arg);

    expect(result).toBe(expected);
    expect(spy).toHaveBeenCalledWith(arg);
  });

  it("delegates signPsbtBuffer to Btc", async () => {
    const expected = { psbt: Buffer.from("signed-psbt"), tx: "rawtx" };
    const spy = jest.spyOn(Btc.prototype, "signPsbtBuffer").mockResolvedValue(expected);
    const psbt = Buffer.from("psbt");
    const options = { autoFinalize: true };

    const result = await signer.signPsbtBuffer(psbt, options);

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith(psbt, options);
  });

  it("delegates signP2SHTransaction to Btc", async () => {
    const expected = ["sig-1", "sig-2"];
    const spy = jest.spyOn(Btc.prototype, "signP2SHTransaction").mockResolvedValue(expected);
    const arg = {
      inputs: [],
      associatedKeysets: [],
      outputScriptHex: "00",
    };

    const result = await signer.signP2SHTransaction(arg);

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith(arg);
  });

  it("delegates splitTransaction to Btc", () => {
    const expected = { version: Buffer.from([0x02]) };
    const spy = jest.spyOn(Btc.prototype, "splitTransaction").mockReturnValue(expected);

    const result = signer.splitTransaction("deadbeef", true, false, ["zcash"]);

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith("deadbeef", true, false, ["zcash"]);
  });

  it("delegates serializeTransactionOutputs to Btc", () => {
    const expected = Buffer.from("serialized");
    const spy = jest
      .spyOn(Btc.prototype, "serializeTransactionOutputs")
      .mockReturnValue(expected);
    const tx = { version: Buffer.from([0x01]) };

    const result = signer.serializeTransactionOutputs(tx);

    expect(result).toEqual(expected);
    expect(spy).toHaveBeenCalledWith(tx);
  });

  it("delegates getTrustedInput to Btc", async () => {
    const expected = "trusted-input";
    const spy = jest.spyOn(Btc.prototype, "getTrustedInput").mockResolvedValue(expected);
    const tx = { version: Buffer.from([0x01]) };

    const result = await signer.getTrustedInput(0, tx, ["zcash"]);

    expect(result).toBe(expected);
    expect(spy).toHaveBeenCalledWith(0, tx, ["zcash"]);
  });

  it("delegates getTrustedInputBIP143 to Btc", () => {
    const expected = "trusted-input-bip143";
    const spy = jest
      .spyOn(Btc.prototype, "getTrustedInputBIP143")
      .mockReturnValue(expected);
    const tx = { version: Buffer.from([0x01]) };

    const result = signer.getTrustedInputBIP143(1, tx, ["zcash"]);

    expect(result).toBe(expected);
    expect(spy).toHaveBeenCalledWith(1, tx, ["zcash"]);
  });

  it("exports PubKeyDisplayMode enum values", () => {
    expect(PubKeyDisplayMode.LONG).toBe(0);
    expect(PubKeyDisplayMode.SHORT).toBe(1);
  });
});
