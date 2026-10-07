import { Psbt, address as btcAddress } from "bitcoinjs-lib";
import cashaddr from "cashaddrjs";
import { http, HttpResponse } from "msw";
import { createApi } from "../../api";
import { coinTraits } from "../coinTraits";
import { OpReturnDataSizeLimit } from "../../errors";
import { FINAL_SEQUENCE, RBF_SEQUENCE, craftTransaction } from "../craftTransaction";
import type { BitcoinIntent } from "../intent";
import { cryptoFor, derivationModeOf } from "../selectUtxos";
import { type SigningRequest } from "../signingRequest";
import { validateIntent } from "../validateIntent";
import { CURRENCY_ADDRESSES } from "./helpers/fixtures";
import { fundingTransaction } from "./helpers/keys";
import {
  explorerUrl,
  feesHandler,
  networkHandler,
  pendingUtxosHandler,
  server,
  testContext,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

/** Serves confirmed outputs of `sender` and their previous transactions on `explorerId`. */
function fund(currencyId: string, explorerId: string, sender: string, values: number[]) {
  const script = cryptoFor(currencyId).toOutputScript(sender);
  const previous = values.map((value, salt) => fundingTransaction(script, value, salt));
  server.use(
    feesHandler({ "2": 32_000, "4": 31_000, "6": 30_000 }, explorerId),
    networkHandler("0.0001", explorerId),
    utxosHandler(
      sender,
      [
        {
          data: previous.map((tx, i) => ({
            txId: tx.getId(),
            outputIndex: 0,
            value: String(values[i]),
            hex: script.toString("hex"),
            height: 100 + i,
          })),
          token: null,
        },
      ],
      explorerId,
    ),
    pendingUtxosHandler(sender, {}, explorerId),
    ...previous.map(tx =>
      http.get(`${explorerUrl(explorerId)}/tx/${tx.getId()}/hex`, () =>
        HttpResponse.json({ hex: tx.toHex() }),
      ),
    ),
  );
}

const send = (sender: string, recipient: string, overrides: Partial<BitcoinIntent> = {}) => ({
  intentType: "transaction" as const,
  type: "send",
  sender,
  recipient,
  amount: 50_000_000n,
  asset: { type: "native" as const },
  ...overrides,
});

describe("craftTransaction across the bitcoin family", () => {
  it.each([
    ["bitcoin", "btc", "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64", 2, RBF_SEQUENCE],
    ["litecoin", "ltc", "ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx", 1, FINAL_SEQUENCE],
    ["dogecoin", "doge", CURRENCY_ADDRESSES.dogecoin, 1, FINAL_SEQUENCE],
    ["bitcoin_cash", "bch", CURRENCY_ADDRESSES.bitcoin_cash, 1, FINAL_SEQUENCE],
    ["qtum", "qtum", CURRENCY_ADDRESSES.qtum, 2, FINAL_SEQUENCE],
  ] as const)(
    "builds %s transactions with the version and sequence its Ledger app and the bridge use",
    async (currencyId, explorerId, sender, version, sequence) => {
      fund(currencyId, explorerId, sender, [80_000_000]);
      const crafted = await craftTransaction(
        testContext({ explorerId }),
        currencyId,
        send(sender, sender),
      );
      const psbt = Psbt.fromBase64(crafted.transaction);
      expect(psbt.version).toBe(version);
      expect(psbt.txInputs.map(input => input.sequence)).toEqual([sequence]);
    },
  );

  it("pays a Bitcoin Cash cashaddr recipient", async () => {
    const sender = CURRENCY_ADDRESSES.bitcoin_cash;
    // The cashaddr form of a legacy P2PKH address: same key hash.
    const { hash } = btcAddress.fromBase58Check(CURRENCY_ADDRESSES.bitcoin_cash);
    const recipient = cashaddr.encode("bitcoincash", "P2PKH", new Uint8Array(hash));
    fund("bitcoin_cash", "bch", sender, [80_000_000]);
    const crafted = await craftTransaction(
      testContext({ explorerId: "bch" }),
      "bitcoin_cash",
      send(sender, recipient),
    );
    const [paid] = Psbt.fromBase64(crafted.transaction).txOutputs;
    expect(paid.script).toEqual(cryptoFor("bitcoin_cash").toOutputScript(recipient));
    expect(paid.script).toEqual(
      cryptoFor("bitcoin_cash").toOutputScript(CURRENCY_ADDRESSES.bitcoin_cash),
    );
  });

  it("refuses a Dogecoin amount beyond the range bitcoinjs-lib 6 represents", async () => {
    const sender = CURRENCY_ADDRESSES.dogecoin;
    const script = cryptoFor("dogecoin").toOutputScript(sender);
    // The explorer reports an output above 2^53 koinu; its previous transaction is only carried.
    const previous = fundingTransaction(script, 1);
    server.use(
      feesHandler({ "2": 32_000, "4": 31_000, "6": 30_000 }, "doge"),
      networkHandler("0.0001", "doge"),
      utxosHandler(
        sender,
        [
          {
            data: [
              { txId: previous.getId(), outputIndex: 0, value: "18014398509481984", height: 1 },
            ],
            token: null,
          },
        ],
        "doge",
      ),
      pendingUtxosHandler(sender, {}, "doge"),
      http.get(`${explorerUrl("doge")}/tx/${previous.getId()}/hex`, () =>
        HttpResponse.json({ hex: previous.toHex() }),
      ),
    );
    await expect(
      craftTransaction(
        testContext({ explorerId: "doge" }),
        "dogecoin",
        send(sender, sender, { amount: 2n ** 53n + 2n }),
      ),
    ).rejects.toThrow("exceeds the supported range");
  });

  describe("OP_RETURN data", () => {
    const sender = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
    const memo = Buffer.from("=:ETH.ETH:0x0000000000000000000000000000000000000000").toString(
      "hex",
    );

    it("pays the recipient, then the OP_RETURN output, then the change", async () => {
      fund("bitcoin", "btc", sender, [80_000_000]);
      const crafted = await craftTransaction(
        testContext(),
        "bitcoin",
        send(sender, sender, { data: { type: "bitcoin", opReturnData: memo } }),
      );
      const outputs = Psbt.fromBase64(crafted.transaction).txOutputs;
      const crypto = cryptoFor("bitcoin");
      expect(outputs.map(output => [output.script.toString("hex"), output.value])).toEqual([
        [crypto.toOutputScript(sender).toString("hex"), 50_000_000],
        [crypto.toOpReturnOutputScript(Buffer.from(memo, "hex")).toString("hex"), 0],
        [crypto.toOutputScript(sender).toString("hex"), Number(crafted.details?.change)],
      ]);
    });

    it("carries the OP_RETURN output in a signing request", async () => {
      const komodo = "RNjJYvz6aCMaeZanXfCpXvoc2FKxEKMTj2";
      fund("komodo", "kmd", komodo, [80_000_000]);
      const crafted = await craftTransaction(
        testContext({ explorerId: "kmd" }),
        "komodo",
        send(komodo, CURRENCY_ADDRESSES.komodo, {
          data: { type: "bitcoin", opReturnData: memo },
        }),
      );
      const request = JSON.parse(crafted.transaction) as SigningRequest;
      expect(request.outputs[1]).toEqual({
        script: cryptoFor("komodo")
          .toOpReturnOutputScript(Buffer.from(memo, "hex"))
          .toString("hex"),
        value: "0",
      });
      expect(request.changeOutputIndex).toBe(2);
    });

    it("refuses data over the relay limit, as the bridge does", async () => {
      fund("bitcoin", "btc", sender, [80_000_000]);
      const tooLong = "ab".repeat(84);
      await expect(
        craftTransaction(
          testContext(),
          "bitcoin",
          send(sender, sender, { data: { type: "bitcoin", opReturnData: tooLong } }),
        ),
      ).rejects.toBeInstanceOf(OpReturnDataSizeLimit);
      const validation = await validateIntent(
        "bitcoin",
        send(sender, sender, { data: { type: "bitcoin", opReturnData: tooLong } }),
        [{ value: 100_000_000n, asset: { type: "native" } }],
      );
      expect(validation.errors.opReturnSizeLimit).toBeInstanceOf(OpReturnDataSizeLimit);
    });

    it("refuses data that is not hex", async () => {
      const validation = await validateIntent(
        "bitcoin",
        send(sender, sender, { data: { type: "bitcoin", opReturnData: "not hex" } }),
        [{ value: 100_000_000n, asset: { type: "native" } }],
      );
      expect(validation.errors.opReturnSizeLimit?.message).toBe("opReturnData must be hex");
    });
  });
});

describe("every currency coin-bitcoin serves", () => {
  const currencies = Object.entries(CURRENCY_ADDRESSES);

  it.each(currencies.filter(([id]) => !coinTraits[id]?.notServedByCoinModuleApi))(
    "%s: the API is created and reads the address type of %s",
    (currencyId, address) => {
      expect(() => createApi(currencyId)).not.toThrow();
      const crypto = cryptoFor(currencyId);
      expect(crypto.validateAddress(address)).toBe(true);
      expect(() => derivationModeOf(crypto.toOutputScript(address))).not.toThrow();
    },
  );

  it.each(currencies.filter(([id]) => coinTraits[id]?.notServedByCoinModuleApi))(
    "%s is refused",
    currencyId => {
      expect(() => createApi(currencyId)).toThrow(`unsupported currency ${currencyId}`);
    },
  );
});
