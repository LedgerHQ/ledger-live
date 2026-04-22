import { type AminoMsg, makeSignDoc, Secp256k1HdWallet, type StdFee } from "@cosmjs/amino";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { buildTransaction } from "../buildTransaction";
import { CosmosAPI } from "./Cosmos";

describe("Broadcast", () => {
  it("throws on uninitialized account", async () => {
    const cosmosApi = new CosmosAPI("cosmos", {
      endpoint: "https://cosmoshub4.coin.ledger.com",
    } as any);
    const wallet = await Secp256k1HdWallet.generate(24, { prefix: "cosmos" });
    const [account] = await wallet.getAccounts();
    const { accountNumber, sequence, pubKeyType } = await cosmosApi.getAccount(account.address);
    const chainId = "cosmoshub-4";
    const aminoMsgs: AminoMsg[] = [
      {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: account.address,
          to_address: account.address,
          amount: [{ amount: "1", denom: "uatom" }],
        },
      },
    ];
    const feeToEncode: StdFee = {
      amount: [{ amount: "2750", denom: "uatom" }],
      gas: "109965",
    };
    const stdSignDoc = makeSignDoc(
      aminoMsgs,
      feeToEncode,
      chainId,
      "",
      accountNumber.toString(),
      sequence.toString(),
    );
    const { signature: aminoSig } = await wallet.signAmino(account.address, stdSignDoc);
    const signatureBytes = Buffer.from(aminoSig.signature, "base64");
    const pubKeyB64 = Buffer.from(account.pubkey).toString("base64");
    const txBytes = buildTransaction({
      protoMsgs: [
        {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: MsgSend.encode({
            fromAddress: account.address,
            toAddress: account.address,
            amount: [{ denom: "uatom", amount: "1" }],
          }).finish(),
        },
      ],
      memo: "",
      pubKeyType,
      pubKey: pubKeyB64,
      feeAmount: stdSignDoc.fee.amount as any,
      gasLimit: stdSignDoc.fee.gas,
      sequence: stdSignDoc.sequence,
      signature: signatureBytes,
    });
    const hex = Buffer.from(txBytes).toString("hex");

    await expect(
      cosmosApi.broadcast({ signedOperation: { signature: hex } } as any),
    ).rejects.toThrow(/unknown address/);
  });
});
