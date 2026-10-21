import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Address } from "@ton/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { NOT_MASTER, OWNER, PEER_RAW } from "../../test/history.fixtures";
import type { TonMemo } from "../../types";
import { validateIntent } from "../validateIntent";

const intent = (overrides: Partial<TransactionIntent<TonMemo>> = {}): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: OWNER,
    recipient: PEER_RAW,
    amount: 1_000_000n,
    asset: { type: "native" },
    sequence: 3n,
    memo: { type: "none" },
    ...overrides,
  }) as TransactionIntent<TonMemo>;

const native = { value: 1_000_000_000n, asset: { type: "native" } };
const jetton = { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER };

describe("validateIntent", () => {
  const server = setupServer();
  const context = createMockTonContext();

  const serveFees = () =>
    server.use(
      http.post(`${TON_API_MOCKED}/estimateFee`, () =>
        HttpResponse.json({
          source_fees: { in_fwd_fee: 1, storage_fee: 2, gas_fee: 3, fwd_fee: 4 },
          destination_fees: [],
        }),
      ),
    );

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("prices the transfer itself when given no fees", async () => {
    serveFees();

    await expect(validateIntent(context, intent(), [native])).resolves.toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 10n,
      amount: 1_000_000n,
      totalSpent: 1_000_010n,
    });
  });

  it("reports a comment too long for the device once it has priced the transfer", async () => {
    serveFees();
    const memo = { type: "string", kind: "comment", value: "x".repeat(200) } as const;

    const { errors } = await validateIntent(context, intent({ memo }), [native]);

    expect(errors).toEqual({ transaction: expect.objectContaining({ name: "TonCommentInvalid" }) });
  });

  it("reports a recipient with a checksum typo once it has priced the transfer", async () => {
    serveFees();
    const peer = Address.parse(PEER_RAW).toString({ urlSafe: true, bounceable: false });
    const recipient = `${peer.slice(0, -1)}${peer.endsWith("A") ? "B" : "A"}`;

    const { errors } = await validateIntent(context, intent({ recipient }), [native]);

    expect(errors).toEqual({ recipient: expect.objectContaining({ name: "InvalidAddress" }) });
  });

  it("reports an invalid sender without pricing the transfer", async () => {
    const { errors, estimatedFees } = await validateIntent(
      context,
      intent({ sender: "not-an-address" }),
      [native],
    );

    expect(errors).toEqual({ sender: expect.objectContaining({ name: "InvalidAddress" }) });
    expect(estimatedFees).toBe(0n);
  });

  it("rejects a send-max whose fees exceed a balance above the 0.02 TON floor", async () => {
    const { errors, amount, totalSpent } = await validateIntent(
      context,
      intent({ useAllAmount: true, amount: 0n }),
      [{ value: 25_000_000n, asset: { type: "native" } }],
      { value: 30_000_000n },
    );

    expect(errors).toEqual({ amount: expect.objectContaining({ name: "NotEnoughBalance" }) });
    expect(amount).toBe(0n);
    expect(totalSpent).toBe(30_000_000n);
  });

  it.each([
    ["native", { type: "native" }],
    ["jetton", jetton],
  ])("rejects a negative %s amount", async (_, asset) => {
    const { errors } = await validateIntent(
      context,
      intent({ asset, amount: -1n }),
      [native, { value: 5n, asset: jetton }],
      { value: 10n },
    );

    expect(errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("rejects a negative TON amount once it has priced the transfer", async () => {
    serveFees();

    const { errors } = await validateIntent(context, intent({ amount: -1n }), [native]);

    expect(errors).toEqual({ amount: expect.objectContaining({ name: "NotEnoughBalance" }) });
  });

  describe("with funds a pending send already spends", () => {
    const balances = [
      { ...native, locked: 400_000_000n },
      { value: 5n, locked: 3n, asset: jetton },
    ];

    it("leaves the locked TON out of the spendable balance", async () => {
      const { errors } = await validateIntent(context, intent({ amount: 700_000_000n }), balances, {
        value: 10n,
      });

      expect(errors).toEqual({ amount: expect.objectContaining({ name: "NotEnoughBalance" }) });
    });

    it("sends only the unlocked TON less the fees on send-max", async () => {
      const { errors, amount } = await validateIntent(
        context,
        intent({ useAllAmount: true, amount: 0n }),
        balances,
        { value: 10n },
      );

      expect(errors).toEqual({});
      expect(amount).toBe(600_000_000n - 10n);
    });

    it("leaves the locked jettons out of the spendable balance", async () => {
      const { errors } = await validateIntent(
        context,
        intent({ asset: jetton, amount: 3n }),
        balances,
        { value: 100_000_000n },
      );

      expect(errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("sends only the unlocked jettons on send-max", async () => {
      const { errors, amount } = await validateIntent(
        context,
        intent({ asset: jetton, useAllAmount: true, amount: 0n }),
        balances,
        { value: 100_000_000n },
      );

      expect(errors).toEqual({});
      expect(amount).toBe(2n);
    });
  });

  it("finds no balance for a jetton the sender does not hold", async () => {
    const other = { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER };

    const { errors } = await validateIntent(context, intent({ asset: other }), [native], {
      value: 100_000_000n,
    });

    expect(errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("finds a jetton balance whatever form its master address takes", async () => {
    const asset = { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER };
    const held = {
      value: 5n,
      asset: {
        ...asset,
        assetReference: "0:2F956143C461769579BAEF2E32CC2D7BC18283F40D20BB03E432CD603AC33FFC",
      },
    };

    const { errors, amount } = await validateIntent(
      context,
      intent({ asset, useAllAmount: true, amount: 0n }),
      [native, held],
      { value: 100_000_000n },
    );

    expect(errors).toEqual({});
    expect(amount).toBe(5n);
  });
});
