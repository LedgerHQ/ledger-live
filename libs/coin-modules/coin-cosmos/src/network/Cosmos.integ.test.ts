import { type AminoMsg, makeSignDoc, Secp256k1HdWallet, type StdFee } from "@cosmjs/amino";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { LedgerAPI5xx } from "@ledgerhq/live-network";
import { buildTransaction } from "../buildTransaction";
import { CosmosAPI } from "./Cosmos";

describe("fetchTransactions", () => {
  const cosmosApi = new CosmosAPI("cosmos", {
    endpoint: "https://cosmoshub4.coin.ledger.com",
  } as any);

  it("respects the limit", async () => {
    const result = await cosmosApi["fetchTransactions"](
      new URLSearchParams({
        query: "message.sender='cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq'",
        page: "1",
        limit: "5",
        order_by: "ORDER_BY_DESC",
      }),
    );
    expect(result.txs.length).toBeGreaterThan(0);
    expect(result.txs.length).toBeLessThanOrEqual(5);
  });

  it.each([
    ["ORDER_BY_DESC", (first: number, last: number) => first >= last],
    ["ORDER_BY_ASC", (first: number, last: number) => first <= last],
  ] as const)("respects %s", async (order_by, compare) => {
    const result = await cosmosApi["fetchTransactions"](
      new URLSearchParams({
        query: "message.sender='cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq'",
        page: "1",
        limit: "10",
        order_by,
      }),
    );
    expect(result.txs.length).toBeGreaterThan(1);
    expect(
      compare(Number(result.txs[0].height), Number(result.txs[result.txs.length - 1].height)),
    ).toBe(true);
  });
});

// Injective runs cosmos-sdk v0.50.x: the modern `query`/`page`/`limit` path, the one that 500s
// when asked for a page past the last.
describe("transaction paging past the last page (injective)", () => {
  const injectiveApi = new CosmosAPI("injective", {
    endpoint: "https://injective.coin.ledger.com",
  } as any);
  // No indexed history: `total` is 0, so page 1 is the only page that exists.
  const EMPTY_ADDRESS = "inj1vmzrwxhgllkjaswzawaue7m7f9qcrc0rfth2v2";
  const query = (page: string) =>
    new URLSearchParams({
      query: `message.sender='${EMPTY_ADDRESS}'`,
      page,
      limit: "100",
      order_by: "ORDER_BY_DESC",
    });

  it("serves page 1 with a numeric total, even when the history is empty", async () => {
    const result = await injectiveApi["fetchTransactions"](query("1"));

    expect(result.txs).toEqual([]);
    // "0" on the wire; the loop compares it against a length.
    expect(result.total).toBe(0);
    expect(typeof result.total).toBe("number");
  });

  it("rejects with a 5xx on the page after the last one", async () => {
    // The status is what matters — the LCD wording drifts between sdk versions, and if this ever
    // maps to a 4xx instead the assertion flips (our retry policy stops tripling it).
    await expect(injectiveApi["fetchTransactions"](query("2"))).rejects.toBeInstanceOf(
      LedgerAPI5xx,
    );
  });

  it("keeps the pages already fetched when a real page failure lands mid-walk", async () => {
    // Real error object from the live node, replayed through the loop against a node that counts
    // 50 txs but serves 1. Unhandled, it reaches the outer catch and the account looks empty.
    const realError = await injectiveApi["fetchTransactions"](query("2")).catch(e => e);
    expect(realError).toBeInstanceOf(LedgerAPI5xx);

    const spy = jest
      .spyOn(injectiveApi as any, "fetchTransactions")
      .mockResolvedValueOnce({ txs: [{ txhash: "kept" }], total: 50 })
      .mockRejectedValueOnce(realError);

    try {
      const txs = await injectiveApi["fetchAllTransactions"](EMPTY_ADDRESS, "message.sender", 100);
      expect(txs).toEqual([{ txhash: "kept" }]);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("survives cosmoshub's undecodable page instead of reporting no history", async () => {
    // This mainnet address holds a tx from the removed liquidity module: page 9 of its history
    // 500s with "unable to resolve type URL ... tx parse error", permanently. Before the fix that
    // one page emptied the whole account.
    const hubApi = new CosmosAPI("cosmos", {
      endpoint: "https://cosmoshub4.coin.ledger.com",
    } as any);

    const txs = await hubApi["fetchAllTransactions"](
      "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
      "message.sender",
      100,
    );

    // The guarantee is "the bad page doesn't empty the account", not the exact history size:
    // a regression collapses this to 0, and one page's worth would mean we stopped at the failure.
    expect(txs.length).toBeGreaterThan(100);
  }, 120_000);

  it("fetches a real history without tripping the paging guard", async () => {
    const funded = "inj1x6f40tll93pee46uz0ym8jfwu5yahmkcxkmzwv";
    const txs = await injectiveApi["fetchAllTransactions"](funded, "transfer.recipient", 100);

    expect(txs.length).toBeGreaterThan(0);
    expect(txs.length).toBeLessThanOrEqual(100);
  });
});

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
