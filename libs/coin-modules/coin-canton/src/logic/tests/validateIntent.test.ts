import type {
  AssetInfo,
  Balance,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { TO_MANY_UTXOS_CRITICAL_COUNT, TO_MANY_UTXOS_WARNING_COUNT } from "../../constants";
import {
  getBalance,
  getPartyByIdCached,
  isTopologyChangeRequiredCached,
} from "../../network/gateway";
import {
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
} from "../../test/fixtures";
import { TooManyUtxosCritical, TooManyUtxosWarning, TopologyChangeError } from "../../types/errors";
import type { CantonMemo } from "../../types/transaction";
import { validateIntent } from "../validateIntent";

jest.mock("../../network/gateway", () => ({
  getBalance: jest.fn(),
  getPartyByIdCached: jest.fn(),
  isTopologyChangeRequiredCached: jest.fn(),
}));

const mockedGetBalance = jest.mocked(getBalance);
const mockedGetParty = jest.mocked(getPartyByIdCached);
const mockedIsTopologyChangeRequired = jest.mocked(isTopologyChangeRequiredCached);

const SENDER = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const RECIPIENT = "bob::122014d3f17b82700d15bef451bcb1d112136eb82bb3f4fd2a4649f95a9c4632b000";
const ISSUER = "issuer::1220";
const TOKEN = { type: "token", assetReference: "USDCx", assetOwner: ISSUER } as const;
const OTHER_ADMIN_TOKEN = { ...TOKEN, assetOwner: "other::1220" } as const;
const OWNERLESS_TOKEN = { type: "token", assetReference: "USDCx" } as const;
const config = createMockCoinConfigValue();
const context = createMockContext(config);
const reserve = BigInt(config.minReserve ?? 0);
const ONE_CC = 10n ** 38n;

const intent = (overrides: Record<string, unknown> = {}) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 100n,
    asset: { type: "native" },
    ...overrides,
  }) as TransactionIntent<CantonMemo>;

const native = (value: bigint, locked?: bigint): Balance => ({
  asset: { type: "native" },
  value,
  ...(locked === undefined ? {} : { locked }),
});
const token = (value: bigint, asset: AssetInfo = TOKEN): Balance => ({ asset, value, locked: 0n });

// Gateway balance rows, alternating unlocked and locked.
const rows = (...counts: [instrumentId: string, adminId: string, utxoCount: number][]) =>
  createMockInstrumentBalances(
    counts.length,
    counts.map(([instrument_id, admin_id, utxo_count], index) => ({
      instrument_id,
      admin_id,
      utxo_count,
      locked: index % 2 === 1,
    })),
  );

const validate = (
  overrides: Record<string, unknown> = {},
  balances: Balance[] = [native(1000n, 0n)],
  fees: bigint | null = 10n,
) =>
  validateIntent(context, intent(overrides), balances, fees === null ? undefined : { value: fees });

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetBalance.mockResolvedValue([]);
    mockedGetParty.mockResolvedValue({ party_id: SENDER, public_key: "test-public-key" });
    mockedIsTopologyChangeRequired.mockResolvedValue(false);
  });

  describe("fees", () => {
    it("should return FeeNotLoaded when no fee is passed", async () => {
      const { errors, warnings } = await validate({}, undefined, null);

      expect(errors.fee).toBeInstanceOf(FeeNotLoaded);
      expect(warnings).toEqual({});
    });

    it("should accept a zero fee, since the config forces one on every network", async () => {
      const { errors } = await validate({}, undefined, 0n);

      expect(errors).toEqual({});
    });

    it("should warn FeeTooHigh when the fee exceeds a tenth of the amount", async () => {
      const { warnings } = await validate({}, undefined, 11n);

      expect(warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });

    it("should not warn FeeTooHigh when the fee is exactly a tenth of the amount", async () => {
      const { errors, warnings } = await validate();

      expect(errors).toEqual({});
      expect(warnings).toEqual({});
    });

    it("should not warn FeeTooHigh on a token transfer, whose fee the parent pays", async () => {
      const { warnings } = await validate(
        { asset: TOKEN },
        [native(10_000n, 0n), token(1000n)],
        1500n,
      );

      expect(warnings.feeTooHigh).toBeUndefined();
    });
  });

  describe("native balance", () => {
    it("should return NotEnoughSpendableBalance when the total spent eats into the reserve", async () => {
      const { errors } = await validate({ amount: 1000n - reserve + 1n });

      expect(errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
    });

    it("should return NotEnoughBalanceBecauseDestinationNotCreated when the amount is below the reserve", async () => {
      const { errors } = await validate({ amount: reserve - 1n });

      expect(errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });

    describe("against a 1 CC reserve", () => {
      const oneCcReserve = createMockContext({ ...config, minReserve: 1e38 });
      const send = (amount: bigint) =>
        validateIntent(oneCcReserve, intent({ amount }), [native(2n * ONE_CC, 0n)], { value: 0n });

      it("should name the reserve in NotEnoughSpendableBalance, one unit past it", async () => {
        const { errors } = await send(ONE_CC + 1n);

        expect(errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
        expect(errors.amount).toMatchObject({ minimumAmount: "1\u00a0CC" });
      });

      it("should name the reserve in NotEnoughBalanceBecauseDestinationNotCreated, one unit under it", async () => {
        const { errors } = await send(ONE_CC - 1n);

        expect(errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
        expect(errors.amount).toMatchObject({ minimalAmount: "1\u00a0CC" });
      });

      it("should accept exactly the reserve", async () => {
        const { errors } = await send(ONE_CC);

        expect(errors.amount).toBeUndefined();
      });
    });

    it("should pass when the transfer is within limits", async () => {
      const { errors } = await validate({ amount: 500n });

      expect(errors.amount).toBeUndefined();
    });

    it("should return NotEnoughBalance when the locked part leaves too little to spend", async () => {
      const { errors } = await validate({ amount: 500n }, [native(1000n, 600n)]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should treat an absent locked part as fully spendable", async () => {
      const { errors } = await validate({ amount: 500n }, [native(1000n)]);

      expect(errors.amount).toBeUndefined();
    });

    it("should add up the components of the native balance", async () => {
      const { errors } = await validate({ amount: 500n }, [native(300n, 0n), native(700n, 0n)]);

      expect(errors.amount).toBeUndefined();
    });

    it("should return NotEnoughBalance when the account holds nothing", async () => {
      const { errors } = await validate({ amount: 500n }, []);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("token balance", () => {
    it("should return NotEnoughBalanceInParentAccount when the native balance cannot pay the fee", async () => {
      const { errors } = await validate({ asset: TOKEN }, [native(5n, 0n), token(1000n)]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalanceInParentAccount);
    });

    it("should not let locked native funds pay the fee", async () => {
      const { errors } = await validate({ asset: TOKEN }, [native(1000n, 1000n), token(1000n)]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalanceInParentAccount);
    });

    it("should report NotEnoughBalanceInParentAccount over AmountRequired, as the bridge does", async () => {
      const { errors } = await validate({ asset: TOKEN, amount: 0n }, [
        native(5n, 0n),
        token(1000n),
      ]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalanceInParentAccount);
    });

    it("should return NotEnoughBalance when the token balance is too low", async () => {
      const { errors } = await validate({ asset: TOKEN, amount: 200n }, [
        native(1000n, 0n),
        token(100n),
      ]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should match a cip56 intent against the token balance of the same instrument", async () => {
      const { errors } = await validate({ asset: { ...TOKEN, type: "cip56" }, amount: 500n }, [
        native(1000n, 0n),
        token(1000n),
      ]);

      expect(errors.amount).toBeUndefined();
    });

    it("should add up the components of the same instrument and admin", async () => {
      const { errors } = await validate({ asset: TOKEN, amount: 500n }, [
        native(1000n, 0n),
        token(300n),
        token(700n),
      ]);

      expect(errors.amount).toBeUndefined();
    });

    it("should not count a balance of the same instrument under another admin", async () => {
      const { errors } = await validate({ asset: TOKEN, amount: 500n }, [
        native(1000n, 0n),
        token(1000n, OTHER_ADMIN_TOKEN),
      ]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should match an ownerless intent against the only balance of its instrument", async () => {
      const { errors } = await validate({ asset: OWNERLESS_TOKEN, amount: 500n }, [
        native(1000n, 0n),
        token(1000n),
      ]);

      expect(errors.amount).toBeUndefined();
    });

    it.each([
      ["the poorer one first", [token(100n), token(1000n, OTHER_ADMIN_TOKEN)]],
      ["the richer one first", [token(1000n, OTHER_ADMIN_TOKEN), token(100n)]],
    ])(
      "should pick no balance for an ownerless intent held under two admins, %s",
      async (_, tokens) => {
        const { errors } = await validate({ asset: OWNERLESS_TOKEN, amount: 500n }, [
          native(1000n, 0n),
          ...tokens,
        ]);

        expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
      },
    );

    it("should skip the reserve checks, which only apply to the native coin", async () => {
      const { errors } = await validate({ asset: TOKEN, amount: reserve - 1n }, [
        native(1000n, 0n),
        token(1000n),
      ]);

      expect(errors.amount).toBeUndefined();
    });

    it("should throw on an asset Canton cannot transfer", async () => {
      await expect(
        validate({ asset: { type: "template", assetReference: "Template" } }),
      ).rejects.toThrow(InvalidParameterError);
    });
  });

  describe("recipient", () => {
    it("should return RecipientRequired when the recipient is missing", async () => {
      const { errors } = await validate({ recipient: "" });

      expect(errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should accept sending to self", async () => {
      const { errors } = await validate({ recipient: SENDER });

      expect(errors.recipient).toBeUndefined();
    });

    it("should return InvalidAddress naming the currency when the recipient is invalid", async () => {
      const { errors } = await validate({ recipient: "invalid-address" });

      expect(errors.recipient).toBeInstanceOf(InvalidAddress);
      expect(errors.recipient).toMatchObject({ currencyName: config.name });
    });
  });

  describe("amount", () => {
    it("should return AmountRequired when the amount is zero", async () => {
      const { errors } = await validate({ amount: 0n });

      expect(errors.amount).toBeInstanceOf(AmountRequired);
    });

    it.each([
      ["the native coin", { type: "native" }, [native(1000n, 0n)]],
      ["a token the account does not hold", TOKEN, [native(1000n, 0n)]],
    ])("should return AmountRequired for a negative amount of %s", async (_, asset, balances) => {
      const { errors } = await validate({ asset, amount: -1n }, balances, 0n);

      expect(errors.amount).toBeInstanceOf(AmountRequired);
    });
  });

  describe("send-max", () => {
    it("should send the spendable native balance less the fee", async () => {
      const { errors, amount, totalSpent } = await validate({ useAllAmount: true, amount: 0n }, [
        native(1000n, 100n),
      ]);

      expect(errors).toEqual({});
      expect({ amount, totalSpent }).toEqual({ amount: 890n, totalSpent: 900n });
    });

    it("should send the whole spendable token holding, whose fee the parent pays", async () => {
      const { errors, amount, totalSpent } = await validate(
        { asset: TOKEN, useAllAmount: true, amount: 0n },
        [native(1000n, 0n), token(700n)],
      );

      expect(errors).toEqual({});
      expect({ amount, totalSpent }).toEqual({ amount: 700n, totalSpent: 700n });
    });

    it("should replace a stale amount with the maximum", async () => {
      const { amount } = await validate({ useAllAmount: true, amount: 5n }, [native(1000n, 100n)]);

      expect(amount).toBe(890n);
    });

    it("should return NotEnoughBalance, not AmountRequired, when the fee leaves nothing to send", async () => {
      const { errors } = await validate({ useAllAmount: true, amount: 0n }, [native(5n, 0n)]);

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("return values", () => {
    it("should add the fee to the total spent of a native transfer", async () => {
      await expect(validate()).resolves.toMatchObject({
        estimatedFees: 10n,
        amount: 100n,
        totalSpent: 110n,
      });
    });

    it("should leave the fee out of the total spent of a token transfer", async () => {
      await expect(
        validate({ asset: TOKEN }, [native(1000n, 0n), token(1000n)]),
      ).resolves.toMatchObject({ estimatedFees: 10n, amount: 100n, totalSpent: 100n });
    });
  });

  describe("UTXO count", () => {
    it("should warn critically above the critical count, counting locked rows too", async () => {
      mockedGetBalance.mockResolvedValue(
        rows(["Amulet", "AmuletAdmin", 20], ["Amulet", "AmuletAdmin", 5]),
      );

      const { warnings } = await validate();

      expect(warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosCritical);
      expect(mockedGetBalance).toHaveBeenCalledWith(config, SENDER);
    });

    it.each([TO_MANY_UTXOS_WARNING_COUNT + 1, TO_MANY_UTXOS_CRITICAL_COUNT])(
      "should warn, not critically, at %i utxos",
      async count => {
        mockedGetBalance.mockResolvedValue(rows(["Amulet", "AmuletAdmin", count]));

        const { warnings } = await validate();

        expect(warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosWarning);
        expect(warnings.tooManyUtxos?.message).toBe("families.canton.tooManyUtxos.warning");
      },
    );

    it("should not warn at the warning count", async () => {
      mockedGetBalance.mockResolvedValue(
        rows(["Amulet", "AmuletAdmin", TO_MANY_UTXOS_WARNING_COUNT]),
      );

      const { warnings } = await validate();

      expect(warnings.tooManyUtxos).toBeUndefined();
    });

    it("should count the native instrument under every admin, as sync does", async () => {
      mockedGetBalance.mockResolvedValue(
        rows(["Amulet", "AmuletAdmin", 6], ["Amulet", "other", 6]),
      );

      const { warnings } = await validate();

      expect(warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosWarning);
    });

    it("should count only the rows of the token being sent", async () => {
      mockedGetBalance.mockResolvedValue(
        rows(["USDCx", ISSUER, 11], ["USDCx", "other::1220", 30], ["Amulet", "AmuletAdmin", 30]),
      );

      const { warnings } = await validate({ asset: TOKEN }, [native(1000n, 0n), token(1000n)]);

      expect(warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosWarning);
    });

    it.each([
      [
        "the unset-recipient sentinel",
        "abandon::ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      ],
      ["the sender itself", SENDER],
      ["an invalid recipient", "invalid-address"],
      ["no recipient", ""],
    ])("should not read the counts for %s", async (_, recipient) => {
      mockedGetBalance.mockResolvedValue(rows(["Amulet", "AmuletAdmin", 30]));

      const { warnings } = await validate({ recipient });

      expect(warnings.tooManyUtxos).toBeUndefined();
      expect(mockedGetBalance).not.toHaveBeenCalled();
    });

    it("should not warn when the gateway read fails", async () => {
      mockedGetBalance.mockRejectedValue(new Error("Network error"));

      const { warnings } = await validate();

      expect(warnings.tooManyUtxos).toBeUndefined();
    });
  });

  describe("topology", () => {
    it("should return TopologyChangeError when a topology change is required", async () => {
      mockedIsTopologyChangeRequired.mockResolvedValue(true);

      const { errors } = await validate();

      expect(errors.topologyChange).toBeInstanceOf(TopologyChangeError);
      expect(mockedGetParty).toHaveBeenCalledWith(config, SENDER);
      expect(mockedIsTopologyChangeRequired).toHaveBeenCalledWith(config, "test-public-key");
    });

    it("should not return a topology error when no change is required", async () => {
      const { errors } = await validate();

      expect(errors.topologyChange).toBeUndefined();
    });

    it.each([
      ["a network error", new Error("Network error")],
      ["a TopologyChangeError, which only the party lookup reports", new TopologyChangeError()],
    ])(
      "should not return a topology error when the topology check fails with %s",
      async (_, error) => {
        mockedIsTopologyChangeRequired.mockRejectedValue(error);

        const { errors } = await validate();

        expect(errors.topologyChange).toBeUndefined();
      },
    );

    it("should return TopologyChangeError when the gateway no longer knows the party", async () => {
      mockedGetParty.mockRejectedValue(new TopologyChangeError("Topology change detected."));

      const { errors } = await validate();

      expect(errors.topologyChange).toBeInstanceOf(TopologyChangeError);
    });

    it("should skip the check when the party lookup fails otherwise", async () => {
      mockedGetParty.mockRejectedValue(new Error("Network error"));

      const { errors } = await validate();

      expect(errors.topologyChange).toBeUndefined();
      expect(mockedIsTopologyChangeRequired).not.toHaveBeenCalled();
    });

    it("should skip the check when the party has no public key", async () => {
      mockedGetParty.mockResolvedValue({ party_id: SENDER, public_key: "" });

      const { errors } = await validate();

      expect(errors.topologyChange).toBeUndefined();
      expect(mockedIsTopologyChangeRequired).not.toHaveBeenCalled();
    });
  });
});
