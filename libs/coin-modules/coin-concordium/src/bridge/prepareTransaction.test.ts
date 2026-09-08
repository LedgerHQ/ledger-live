import BigNumber from "bignumber.js";
import {
  AccountAddress,
  encodePltTransferOperations,
  PLT_MAX_MEMO_SIZE,
} from "@ledgerhq/concordium-core";
import {
  createFixtureAccount,
  createFixtureConfig,
  createFixtureTokenAccount,
  createFixtureTokenCurrency,
  createFixtureTransaction,
  PLT_TOKEN_ID,
  setupTestnetCoinConfig,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
} from "../test/fixtures";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic", () => ({
  estimateFees: jest.fn(),
  estimateTokenFees: jest.fn(),
}));

const { estimateFees, estimateTokenFees } = jest.requireMock("../logic");
const config = createFixtureConfig();

/** The real encoder, so the expected size is derived rather than asserted as a magic number. */
const blobSize = (recipient: string, amount: number | bigint, decimals = 6, memo?: string) =>
  encodePltTransferOperations({
    recipient: AccountAddress.fromBase58(recipient),
    amount: BigInt(amount),
    decimals,
    ...(memo ? { memo: Buffer.from(memo, "utf-8") } : {}),
  }).length;

const tokenAccountFor = (account: ReturnType<typeof createFixtureAccount>) =>
  createFixtureTokenAccount({ parentId: account.id });

const withTokenSubAccount = () => {
  const parent = createFixtureAccount();
  const subAccount = tokenAccountFor(parent);
  return { account: { ...parent, subAccounts: [subAccount] }, subAccount };
};

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTestnetCoinConfig();
    // Default mock: fee estimation returns 500 microCCD
    estimateFees.mockResolvedValue({ cost: BigInt(500), energy: BigInt(501) });
  });

  describe("fee calculation", () => {
    it("should update fee when current fee differs from estimate", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(1000), energy: BigInt(600) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(0) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.fee).toEqual(new BigNumber(1000));
    });

    it("should return same transaction when fee is unchanged", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(500), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(500) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN - same reference = no change
      expect(result).toBe(tx);
    });

    it("should update fee when estimate changes", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(100) });
      estimateFees.mockResolvedValue({ cost: BigInt(200), energy: BigInt(501) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.fee).toEqual(new BigNumber(200));
      expect(result).not.toBe(tx);
    });
  });

  describe("transaction type selection", () => {
    it("should call estimateFees without memo when no memo", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ memo: undefined });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(estimateFees).toHaveBeenCalledWith(config, account.currency.id, undefined);
    });

    it("should call estimateFees with memo when memo is present", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ memo: "test memo" });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(estimateFees).toHaveBeenCalledWith(config, account.currency.id, "test memo");
    });
  });

  describe("transaction immutability", () => {
    it("should not mutate original transaction", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(999), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(0) });
      const originalFee = tx.fee;

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(tx.fee).toBe(originalFee);
    });

    it("should preserve other transaction fields when updating fee", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(999), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({
        amount: new BigNumber(12345),
        recipient: VALID_ADDRESS,
        memo: "preserve me",
      });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.amount).toEqual(new BigNumber(12345));
      expect(result.recipient).toBe(VALID_ADDRESS);
      expect(result.memo).toBe("preserve me");
    });
  });

  describe("PLT transfers", () => {
    beforeEach(() => {
      estimateTokenFees.mockResolvedValue({ cost: BigInt(3600), energy: BigInt(1080) });
    });

    it("prices the token, not the native transfer", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        recipient: VALID_ADDRESS_2,
        amount: new BigNumber(1500000),
      });

      await prepareTransaction(account, tx);

      expect(estimateFees).not.toHaveBeenCalled();
      expect(estimateTokenFees).toHaveBeenCalledWith(config, account.currency.id, {
        tokenId: PLT_TOKEN_ID,
        listOperationsSize: blobSize(VALID_ADDRESS_2, 1500000),
      });
    });

    // The proxy prices the id by its byte length, so it must be the on-chain id
    // and not the CAL token id, which is longer and differently shaped.
    it("sends the on-chain token id", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({ subAccountId: subAccount.id });

      await prepareTransaction(account, tx);

      const [, , params] = estimateTokenFees.mock.calls[0];
      expect(params.tokenId).toBe(PLT_TOKEN_ID);
      expect(params.tokenId).not.toBe(subAccount.token.id);
    });

    it("persists both halves of the estimate", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({ subAccountId: subAccount.id, fee: new BigNumber(0) });

      const result = await prepareTransaction(account, tx);

      expect(result.fee).toEqual(new BigNumber(3600));
      expect(result.energy).toBe(1080);
    });

    it("returns the same transaction when neither half moved", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        fee: new BigNumber(3600),
        energy: 1080,
      });

      expect(await prepareTransaction(account, tx)).toBe(tx);
    });

    // A fee that rounds to the same microCCD while the energy moves would be
    // discarded as unchanged if only the fee were compared, leaving the signed
    // header behind the estimate.
    it("re-persists when only the energy moved", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        fee: new BigNumber(3600),
        energy: 999,
      });

      const result = await prepareTransaction(account, tx);

      expect(result).not.toBe(tx);
      expect(result.energy).toBe(1080);
    });

    it("estimates against the dummy address while the recipient is unparseable", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        recipient: "3kBx2h5Y",
        amount: new BigNumber(1500000),
      });

      await expect(prepareTransaction(account, tx)).resolves.toBeDefined();
      expect(estimateTokenFees).toHaveBeenCalledWith(config, account.currency.id, {
        tokenId: PLT_TOKEN_ID,
        listOperationsSize: blobSize(CONCORDIUM_DUMMY_ADDRESS, 1500000),
      });
    });

    // Every Concordium address is 32 bytes, so substituting one changes nothing
    // the fee depends on.
    it("prices the dummy and the real recipient identically", async () => {
      expect(blobSize(CONCORDIUM_DUMMY_ADDRESS, 1500000)).toBe(blobSize(VALID_ADDRESS_2, 1500000));
    });

    it("leaves the transaction alone when the token has no magnitude", async () => {
      const parent = createFixtureAccount();
      const subAccount = createFixtureTokenAccount({
        parentId: parent.id,
        token: createFixtureTokenCurrency({ units: [] }),
      });
      const account = { ...parent, subAccounts: [subAccount] };
      const tx = createFixtureTransaction({ subAccountId: subAccount.id });

      expect(await prepareTransaction(account, tx)).toBe(tx);
      expect(estimateTokenFees).not.toHaveBeenCalled();
    });

    // Switching from the token back to CCD reaches this branch with the token's
    // energy still attached.
    it("drops a stale energy when the native path re-prices", async () => {
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: null, energy: 1080 });

      const result = await prepareTransaction(account, tx);

      expect(result).not.toHaveProperty("energy");
      expect(result.fee).toEqual(new BigNumber(500));
    });

    it("drops a stale energy even when the native fee is unchanged", async () => {
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(500), energy: 1080 });

      const result = await prepareTransaction(account, tx);

      expect(result).not.toBe(tx);
      expect(result).not.toHaveProperty("energy");
    });

    // 200 bytes of memo, which the second assertion shows the size must grow by.
    it("counts the memo toward the priced size", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const memo = "x".repeat(200);
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        recipient: VALID_ADDRESS_2,
        amount: new BigNumber(1500000),
        memo,
      });

      await prepareTransaction(account, tx);

      const [, , params] = estimateTokenFees.mock.calls[0];
      expect(params.listOperationsSize).toBe(blobSize(VALID_ADDRESS_2, 1500000, 6, memo));
      expect(params.listOperationsSize).toBeGreaterThan(blobSize(VALID_ADDRESS_2, 1500000));
    });

    // The transaction carries amount 0, so pricing it would encode the wrong size.
    it("prices the balance that useAllAmount will send", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        recipient: VALID_ADDRESS_2,
        useAllAmount: true,
        amount: new BigNumber(0),
      });

      await prepareTransaction(account, tx);

      const [, , params] = estimateTokenFees.mock.calls[0];
      expect(params.listOperationsSize).toBe(
        blobSize(VALID_ADDRESS_2, BigInt(subAccount.spendableBalance.toFixed(0))),
      );
    });

    it("prices nothing when the memo is past the chain's limit", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const tx = createFixtureTransaction({
        subAccountId: subAccount.id,
        memo: "x".repeat(PLT_MAX_MEMO_SIZE + 1),
      });

      expect(await prepareTransaction(account, tx)).toBe(tx);
      expect(estimateTokenFees).not.toHaveBeenCalled();
    });

    it("prices nothing when the subAccountId no longer resolves", async () => {
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ subAccountId: "js:2:concordium_testnet:gone:+plt" });

      expect(await prepareTransaction(account, tx)).toBe(tx);
      expect(estimateFees).not.toHaveBeenCalled();
      expect(estimateTokenFees).not.toHaveBeenCalled();
    });

    it("stays on the native path when no sub-account is selected", async () => {
      const { account } = withTokenSubAccount();
      const tx = createFixtureTransaction();

      await prepareTransaction(account, tx);

      expect(estimateTokenFees).not.toHaveBeenCalled();
      expect(estimateFees).toHaveBeenCalled();
    });
  });
});
