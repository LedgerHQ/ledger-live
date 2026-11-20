import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import {
  PolkadotAllFundsWarning,
  PolkadotBondMinimumAmount,
  PolkadotNotValidator,
  PolkadotUnauthorizedOperation,
  PolkadotValidatorsRequired,
} from "../types";
import { buildGetTransactionStatus } from "./getTransactionStatus";

const recipient = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const stubIsNewAccount = jest.fn();
const stubIsControllerAddress = jest.fn();
const stubVerifyValidatorAddresses = jest.fn();
const stubGetMinimumBondBalance = jest.fn();
const stubGetStakingProgress = jest.fn();

jest.mock("../network", () => ({
  isNewAccount: (_config: unknown, address: string, currencyId: string | undefined) =>
    stubIsNewAccount(address, currencyId),
  isControllerAddress: (_config: unknown, address: string, currencyId: string | undefined) =>
    stubIsControllerAddress(address, currencyId),
  verifyValidatorAddresses: () => stubVerifyValidatorAddresses(),
  getMinimumBondBalance: () => stubGetMinimumBondBalance(),
  getStakingProgress: () => stubGetStakingProgress(),
}));

const transaction = (overrides = {}) => ({
  ...createFixtureTransaction({ fees: new BigNumber(0) }),
  ...overrides,
});

const controllerAccount = (overrides = {}) =>
  createFixtureAccount({
    spendableBalance: new BigNumber(20_000_000_000),
    polkadotResources: {
      controller: undefined,
      stash: recipient,
      nonce: 0,
      lockedBalance: new BigNumber(10_000_000_000),
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(2_000_000_000),
      unlockings: [],
      nominations: undefined,
      numSlashingSpans: 0,
    },
    ...overrides,
  });

describe("getTransactionStatus", () => {
  const getTransactionStatus = buildGetTransactionStatus(createMockPolkadotContext());

  beforeEach(() => {
    [
      stubIsNewAccount,
      stubIsControllerAddress,
      stubVerifyValidatorAddresses,
      stubGetMinimumBondBalance,
      stubGetStakingProgress,
    ].forEach(stub => stub.mockReset());
    stubIsNewAccount.mockResolvedValue(false);
    stubIsControllerAddress.mockResolvedValue(false);
    stubVerifyValidatorAddresses.mockResolvedValue([]);
    stubGetMinimumBondBalance.mockResolvedValue(new BigNumber(0));
    stubGetStakingProgress.mockResolvedValue({ electionClosed: true });
  });

  describe("send", () => {
    it.each([
      [
        "the recipient is the sender",
        { recipient: createFixtureAccount().freshAddress },
        InvalidAddressBecauseDestinationIsAlsoSource,
      ],
      ["the recipient is invalid", { recipient: "invalid" }, InvalidAddress],
      ["the amount is missing", { amount: new BigNumber(0) }, AmountRequired],
      [
        "the amount exceeds the spendable balance",
        { amount: new BigNumber(21_000_000_000) },
        NotEnoughBalance,
      ],
    ])("reports %s", async (_name, overrides, ErrorClass) => {
      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ recipient, ...overrides }),
      );

      expect(status.errors.recipient || status.errors.amount).toBeInstanceOf(ErrorClass);
    });

    it("accepts an amount within the spendable balance", async () => {
      const status = await getTransactionStatus(
        controllerAccount({
          balance: new BigNumber(16_705_569_396),
          spendableBalance: new BigNumber(6_705_569_396),
        }),
        transaction({
          recipient,
          amount: new BigNumber(10_000_000),
          fees: new BigNumber(158_612_606),
        }),
      );

      expect(status.errors.amount).toBeUndefined();
    });

    it("reports an existential deposit error for a new destination", async () => {
      stubIsNewAccount.mockResolvedValue(true);

      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ recipient, amount: new BigNumber(1_000_000_000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });

    it("warns when sending all funds from an account with locked funds", async () => {
      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ recipient, useAllAmount: true }),
      );

      expect(status.warnings.amount).toBeInstanceOf(PolkadotAllFundsWarning);
    });
  });

  describe("nominate", () => {
    it.each([
      ["the validators list is empty", [], PolkadotValidatorsRequired],
      ["a validator is invalid", [recipient], PolkadotNotValidator],
    ])("reports an error when %s", async (_name, validators, ErrorClass) => {
      stubVerifyValidatorAddresses.mockResolvedValue(validators);

      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ mode: "nominate", validators }),
      );

      expect(status.errors.staking).toBeInstanceOf(ErrorClass);
    });
  });

  describe("bond", () => {
    it.each([
      [
        "the spendable balance cannot cover the bond",
        controllerAccount({ spendableBalance: new BigNumber(1) }),
        { recipient, amount: new BigNumber(10_000_000_000) },
        NotEnoughBalance,
      ],
      [
        "the recipient is missing",
        controllerAccount({
          polkadotResources: {
            ...controllerAccount().polkadotResources,
            controller: undefined,
            stash: undefined,
          },
        }),
        { recipient: "", amount: new BigNumber(10_000_000_000) },
        RecipientRequired,
      ],
      [
        "the recipient is invalid",
        controllerAccount({
          polkadotResources: {
            ...controllerAccount().polkadotResources,
            controller: undefined,
            stash: undefined,
          },
        }),
        { recipient: "invalid", amount: new BigNumber(10_000_000_000) },
        InvalidAddress,
      ],
    ])("reports an error when %s", async (_name, account, overrides, ErrorClass) => {
      const status = await getTransactionStatus(
        account,
        transaction({ mode: "bond", ...overrides }),
      );

      expect(status.errors.recipient || status.errors.amount).toBeInstanceOf(ErrorClass);
    });

    it("rejects a recipient that is already a controller", async () => {
      stubIsControllerAddress.mockResolvedValue(true);
      const account = controllerAccount({
        polkadotResources: {
          ...controllerAccount().polkadotResources,
          controller: undefined,
          stash: undefined,
        },
      });

      const status = await getTransactionStatus(
        account,
        transaction({ mode: "bond", recipient, amount: new BigNumber(10_000_000_000) }),
      );

      expect(status.errors.recipient).toBeInstanceOf(PolkadotUnauthorizedOperation);
    });

    it("enforces the minimum bond amount", async () => {
      stubGetMinimumBondBalance.mockResolvedValue(new BigNumber(10_000_000_000));

      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ mode: "bond", recipient, amount: new BigNumber(1) }),
      );

      expect(status.errors.amount).toBeInstanceOf(PolkadotBondMinimumAmount);
    });

    it("accepts a valid bond", async () => {
      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ mode: "bond", recipient, amount: new BigNumber(10_000_000_000) }),
      );

      expect({ errors: status.errors, warnings: status.warnings }).toEqual({
        errors: {},
        warnings: {},
      });
    });
  });

  describe("unbond and rebond", () => {
    it.each([
      ["unbond", { amount: new BigNumber(0) }, AmountRequired],
      ["unbond", { amount: new BigNumber(9_000_000_000) }, NotEnoughBalance],
      ["rebond", { amount: new BigNumber(0) }, AmountRequired],
      ["rebond", { amount: new BigNumber(3_000_000_000) }, NotEnoughBalance],
    ] as const)("reports %s amount errors", async (mode, overrides, ErrorClass) => {
      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ mode, ...overrides }),
      );

      expect(status.errors.amount).toBeInstanceOf(ErrorClass);
    });

    it.each([
      ["unbond", new BigNumber(8_000_000_000)],
      ["rebond", new BigNumber(2_000_000_000)],
    ] as const)("uses all available funds when %s uses all", async (mode, amount) => {
      const status = await getTransactionStatus(
        controllerAccount(),
        transaction({ mode, useAllAmount: true }),
      );

      expect({ errors: status.errors, amount: status.amount }).toEqual({ errors: {}, amount });
    });
  });

  it.each(["nominate", "chill", "rebond", "withdrawUnbonded"] as const)(
    "rejects %s for a stash account",
    async mode => {
      const status = await getTransactionStatus(
        controllerAccount({
          polkadotResources: {
            ...controllerAccount().polkadotResources,
            controller: recipient,
            stash: undefined,
          },
        }),
        transaction({ mode, amount: new BigNumber(1) }),
      );

      expect(status.errors.staking).toBeInstanceOf(PolkadotUnauthorizedOperation);
    },
  );
});
