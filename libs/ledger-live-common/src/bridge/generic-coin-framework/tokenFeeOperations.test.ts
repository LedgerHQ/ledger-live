import BigNumber from "bignumber.js";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { buildTokenFeeOperations } from "./tokenFeeOperations";
import type { OperationCommon } from "./types";

const ADDRESS = "0xAbC";
const USDT = { type: "erc20", assetReference: "0xUsdt" };
const USDT_TOKEN = { id: "ethereum/erc20/usdt" } as TokenCurrency;
const USDT_ASSET: AssetInfo = { type: "erc20", assetReference: "0xUSDT", assetOwner: ADDRESS };

const operation = (overrides: Partial<OperationCommon> = {}): OperationCommon => ({
  id: "acc-0xhash-OUT",
  hash: "0xhash",
  accountId: "acc",
  type: "OUT",
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: "0xblock",
  blockHeight: 42,
  senders: [ADDRESS],
  recipients: ["0xRecipient"],
  date: new Date("2026-11-18T00:00:00Z"),
  transactionSequenceNumber: new BigNumber(7),
  hasFailed: false,
  extra: { feeAsset: USDT, feeAmount: "1601", feePayer: ADDRESS },
  ...overrides,
});

const bridgeApi = {
  getTokenFromAsset: jest.fn(async (_asset: AssetInfo) => USDT_TOKEN as TokenCurrency | undefined),
  getAssetFromToken: jest.fn((_token: TokenCurrency, _owner: string) => USDT_ASSET),
};

describe("buildTokenFeeOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("charges a fee the account paid in a token once, as a FEES operation of that token", async () => {
    const result = await buildTokenFeeOperations(
      [
        operation(),
        operation({ id: "acc-0xhash-IN", type: "IN", extra: { ...operation().extra } }),
      ],
      ADDRESS,
      bridgeApi,
      [],
    );

    expect(result).toEqual([
      {
        asset: USDT_ASSET,
        operation: {
          id: "acc-0xhash-FEES",
          hash: "0xhash",
          accountId: "acc",
          type: "FEES",
          value: new BigNumber(1601),
          fee: new BigNumber(1601),
          blockHash: "0xblock",
          blockHeight: 42,
          senders: [ADDRESS],
          recipients: [],
          date: new Date("2026-11-18T00:00:00Z"),
          transactionSequenceNumber: new BigNumber(7),
          hasFailed: false,
          extra: {
            ledgerOpType: "FEES",
            assetReference: "0xUSDT",
            assetOwner: ADDRESS,
            feeAsset: USDT,
            feeAmount: "1601",
            feePayer: ADDRESS,
          },
        },
      },
    ]);
    expect(bridgeApi.getTokenFromAsset).toHaveBeenCalledWith(USDT);
    expect(bridgeApi.getAssetFromToken).toHaveBeenCalledWith(USDT_TOKEN, ADDRESS);
  });

  it("matches the payer whatever its case", async () => {
    const result = await buildTokenFeeOperations(
      [operation({ extra: { ...operation().extra, feePayer: "0xabc" } })],
      ADDRESS,
      bridgeApi,
      [],
    );

    expect(result).toHaveLength(1);
  });

  it("matches a case-sensitive payer exactly", async () => {
    const base58 = "7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5";
    const fees = (feePayer: string) =>
      buildTokenFeeOperations(
        [operation({ extra: { ...operation().extra, feePayer } })],
        base58,
        bridgeApi,
        [],
      );

    expect(await fees(base58)).toHaveLength(1);
    expect(await fees(base58.toLowerCase())).toEqual([]);
  });

  it("keeps a failed transaction's fee", async () => {
    const [result] = await buildTokenFeeOperations(
      [operation({ hasFailed: true })],
      ADDRESS,
      bridgeApi,
      [],
    );

    expect(result.operation).toMatchObject({ hasFailed: true, value: new BigNumber(1601) });
  });

  it.each([
    ["another account paid", { feePayer: "0xOther" }],
    ["the payer is unknown", { feePayer: undefined }],
    ["the fee is native", { feeAsset: undefined, feeAmount: undefined }],
  ])("charges nothing when %s", async (_case, extra) => {
    const result = await buildTokenFeeOperations(
      [operation({ extra: { ...operation().extra, ...extra } })],
      ADDRESS,
      bridgeApi,
      [],
    );

    expect(result).toEqual([]);
    expect(bridgeApi.getTokenFromAsset).not.toHaveBeenCalled();
  });

  it("charges nothing for a token that does not resolve or that the user hides", async () => {
    bridgeApi.getTokenFromAsset.mockResolvedValueOnce(undefined);

    expect(await buildTokenFeeOperations([operation()], ADDRESS, bridgeApi, [])).toEqual([]);
    expect(
      await buildTokenFeeOperations([operation()], ADDRESS, bridgeApi, [USDT_TOKEN.id]),
    ).toEqual([]);
  });

  it("charges nothing when the token asset has no reference or owner", async () => {
    bridgeApi.getAssetFromToken.mockReturnValueOnce({ type: "erc20", assetReference: "0xUSDT" });

    expect(await buildTokenFeeOperations([operation()], ADDRESS, bridgeApi, [])).toEqual([]);
  });

  it("charges nothing when the family cannot resolve tokens", async () => {
    expect(await buildTokenFeeOperations([operation()], ADDRESS, {}, [])).toEqual([]);
  });

  it("fails when the token lookup fails, rather than losing the fee", async () => {
    bridgeApi.getTokenFromAsset.mockRejectedValueOnce(new Error("store unavailable"));

    await expect(buildTokenFeeOperations([operation()], ADDRESS, bridgeApi, [])).rejects.toThrow(
      "store unavailable",
    );
  });
});
