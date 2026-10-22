import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { Address, Cell, loadMessage } from "@ton/core";
import { keyPairFromSeed, sign } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { OWNER, OWNER_PUBLIC_KEY, jettonSendTx } from "../../test/history.fixtures";
import { combine } from "../combine";
import { buildTransferBody } from "../transferBody";

const keys = keyPairFromSeed(Buffer.alloc(32, 7));
const publicKey = keys.publicKey.toString("hex");
const wallet = WalletContractV4.create({ workchain: 0, publicKey: keys.publicKey });

const craft = (seqno: number) => {
  const body = buildTransferBody({
    seqno,
    validUntil: 1792520000,
    sendMode: 3,
    to: Address.parse("EQAH4MY1EbqP7Gg2wJkoZvoCG4BYPsEG5lVBXPZn0UqXNz4y"),
    bounce: true,
    amount: 1n,
    payload: null,
  });
  return {
    body,
    tx: body.toBoc().toString("base64"),
    signature: sign(body.hash(), keys.secretKey).toString("hex"),
  };
};

const readMessage = (boc: string) => loadMessage(Cell.fromBase64(boc).beginParse());

describe("combine", () => {
  it("sends the signed body to the wallet of the public key", () => {
    const { body, tx, signature } = craft(5);

    const message = readMessage(combine(tx, [signature], publicKey));

    expect(message.info.type).toBe("external-in");
    expect(message.info.dest).toEqual(wallet.address);
    expect(message.init).toBeNull();
    const signed = message.body.beginParse();
    expect(signed.loadBuffer(64).toString("hex")).toBe(signature);
    expect(signed.asCell().hash()).toEqual(body.hash());
  });

  it("rebuilds a message the account sent on mainnet under the hash the indexer gave it", () => {
    const signed = Cell.fromBase64(jettonSendTx.in_msg.message_content.body).beginParse();
    const signature = signed.loadBuffer(64).toString("hex");
    const tx = signed.asCell().toBoc().toString("base64");

    const message = combine(tx, [signature], OWNER_PUBLIC_KEY);

    expect(readMessage(message).info.dest).toEqual(Address.parse(OWNER));
    expect(Cell.fromBase64(message).hash().toString("base64")).toBe(jettonSendTx.in_msg.hash);
  });

  it("deploys the wallet with its first transfer", () => {
    const { tx, signature } = craft(0);

    const message = readMessage(combine(tx, [signature], publicKey));

    expect(message.init?.code?.hash()).toEqual(wallet.init.code.hash());
    expect(message.init?.data?.hash()).toEqual(wallet.init.data.hash());
  });

  it.each([[[]], [["aa", "bb"]]])("takes exactly one signature, not %j", signatures => {
    expect(() => combine(craft(5).tx, signatures, publicKey)).toThrow(InvalidParameterError);
  });

  it("needs the public key", () => {
    const { tx, signature } = craft(5);

    expect(() => combine(tx, [signature], undefined)).toThrow(InvalidParameterError);
  });

  it.each([
    ["another body's signature", craft(6).signature],
    ["a truncated signature", craft(5).signature.slice(0, 64)],
  ])("refuses %s", (_, signature) => {
    expect(() => combine(craft(5).tx, [signature], publicKey)).toThrow(
      "The signature does not match this TON transfer and key",
    );
  });

  it("refuses a signature from another key", () => {
    const other = keyPairFromSeed(Buffer.alloc(32, 8)).publicKey.toString("hex");
    const { tx, signature } = craft(5);

    expect(() => combine(tx, [signature], other)).toThrow(InvalidParameterError);
  });
});
