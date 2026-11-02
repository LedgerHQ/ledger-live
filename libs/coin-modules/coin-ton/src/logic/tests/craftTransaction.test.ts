import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Address, SendMode, comment } from "@ton/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import {
  NOT_MASTER,
  NOT_MASTER_RAW,
  OWNER,
  OWNER_JETTON_WALLET_RAW,
  OWNER_RAW,
  PEER_RAW,
} from "../../test/history.fixtures";
import { decodeTransferBody } from "../../test/transferBody";
import type { TonMemo } from "../../types";
import { craftTransaction } from "../craftTransaction";
import { DEFAULT_SUBWALLET_ID, jettonTransferPayload } from "../transferBody";

const NOW = 1792520000;
const PEER_BOUNCEABLE = Address.parse(PEER_RAW).toString({ urlSafe: true, bounceable: true });
const PEER_NON_BOUNCEABLE = Address.parse(PEER_RAW).toString({ urlSafe: true, bounceable: false });

const intent = (overrides: Partial<TransactionIntent<TonMemo>> = {}): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: OWNER,
    recipient: PEER_BOUNCEABLE,
    amount: 1_000_000_000n,
    asset: { type: "native" },
    sequence: 3n,
    memo: { type: "none" },
    ...overrides,
  }) as TransactionIntent<TonMemo>;

const jettonAsset = { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER };

describe("craftTransaction", () => {
  const server = setupServer();
  const context = createMockTonContext();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  let now: jest.SpyInstance;

  beforeEach(() => {
    now = jest.spyOn(Date, "now").mockReturnValue(NOW * 1000);
  });
  afterEach(() => {
    server.resetHandlers();
    now.mockRestore();
  });
  afterAll(() => server.close());

  const craft = async (overrides: Partial<TransactionIntent<TonMemo>> = {}) =>
    decodeTransferBody((await craftTransaction(context, intent(overrides))).transaction);

  it("crafts a native transfer valid for 60 seconds, paying gas on top", async () => {
    await expect(craft()).resolves.toEqual({
      subwalletId: DEFAULT_SUBWALLET_ID,
      validUntil: NOW + 60,
      seqno: 3,
      op: 0,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      to: Address.parse(PEER_RAW),
      bounce: true,
      amount: 1_000_000_000n,
      init: null,
      payload: null,
    });
  });

  it("does not bounce to an address flagged non-bounceable", async () => {
    expect((await craft({ recipient: PEER_NON_BOUNCEABLE })).bounce).toBe(false);
  });

  it("bounces to a raw address, as the legacy bridge does", async () => {
    expect((await craft({ recipient: PEER_RAW })).bounce).toBe(true);
  });

  it("carries the comment", async () => {
    const { payload } = await craft({ memo: { type: "string", kind: "comment", value: "hi" } });

    expect(payload?.hash()).toEqual(comment("hi").hash());
  });

  it("drops a memo that is not a comment", async () => {
    const memo = { type: "string", kind: "destinationTag", value: "42" } as never;

    expect((await craft({ memo })).payload).toBeNull();
  });

  it("sends the whole balance in carry-all mode", async () => {
    await expect(craft({ useAllAmount: true })).resolves.toEqual(
      expect.objectContaining({ sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE, amount: 0n }),
    );
  });

  it("reads the seqno from the wallet when the intent has none", async () => {
    server.use(
      http.get(`${TON_API_MOCKED}/wallet`, () => HttpResponse.json({ seqno: 7, status: "active" })),
    );

    expect((await craft({ sequence: undefined })).seqno).toBe(7);
  });

  describe("jetton transfer", () => {
    let walletQuery: URLSearchParams | undefined;
    const serveJettonWallet = (wallets: object[]) =>
      server.use(
        http.get(`${TON_API_MOCKED}/jetton/wallets`, ({ request }) => {
          walletQuery = new URL(request.url).searchParams;
          return HttpResponse.json({ jetton_wallets: wallets });
        }),
      );
    const notWallet = {
      address: OWNER_JETTON_WALLET_RAW,
      balance: "35000000000",
      owner: OWNER_RAW,
      jetton: NOT_MASTER_RAW,
    };

    it("asks the sender's jetton wallet to transfer, with 0.1 TON for its fees", async () => {
      serveJettonWallet([notWallet]);

      const body = await craft({
        asset: jettonAsset,
        amount: 5_000_000_000n,
        memo: { type: "string", kind: "comment", value: "Sending NOT" },
      });

      expect(walletQuery?.get("owner_address")).toBe(OWNER);
      expect(walletQuery?.get("jetton_address")).toBe(NOT_MASTER);
      expect(body).toEqual(
        expect.objectContaining({
          sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
          to: Address.parse(OWNER_JETTON_WALLET_RAW),
          bounce: true,
          amount: 100_000_000n,
        }),
      );
      expect(body.payload?.hash()).toEqual(
        jettonTransferPayload({
          amount: 5_000_000_000n,
          destination: Address.parse(PEER_RAW),
          responseDestination: Address.parse(OWNER),
          forwardPayload: comment("Sending NOT"),
        }).hash(),
      );
    });

    it.each([
      ["the amount prepared for it, not the live balance", 30_000_000_000n, 30_000_000_000n],
      ["the jetton wallet's balance when given no amount", 0n, 35_000_000_000n],
    ])("sends as a jetton send-max %s", async (_, amount, sent) => {
      serveJettonWallet([notWallet]);

      const body = await craft({ asset: jettonAsset, amount, useAllAmount: true });

      expect(body.sendMode).toBe(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS);
      expect(body.payload?.hash()).toEqual(
        jettonTransferPayload({
          amount: sent,
          destination: Address.parse(PEER_RAW),
          responseDestination: Address.parse(OWNER),
          forwardPayload: null,
        }).hash(),
      );
    });

    it("refuses a jetton the sender holds no wallet for", async () => {
      serveJettonWallet([]);

      await expect(craft({ asset: jettonAsset })).rejects.toThrow(InvalidParameterError);
    });

    it("refuses a jetton without its master", async () => {
      await expect(craft({ asset: { type: "jetton" } })).rejects.toThrow(InvalidParameterError);
    });
  });
});
