import BigNumber from "bignumber.js";
import {
  toMultiversXResourcesRaw,
  fromMultiversXResourcesRaw,
  assignToAccountRaw,
  assignFromAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import type {
  MultiversXResources,
  MultiversXResourcesRaw,
  MultiversXAccount,
  MultiversXAccountRaw,
  MultiversXOperationExtra,
  MultiversXOperationExtraRaw,
} from "./types";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

describe("serialization", () => {
  describe("toMultiversXResourcesRaw", () => {
    it("converts resources to raw format", () => {
      const resources: MultiversXResources = {
        nonce: 10,
        delegations: [
          {
            address: "erd1...",
            contract: "erd1contract",
            userActiveStake: "1000",
            userDeferredPaymentStake: "0",
            userUnstakedStake: "0",
            userWaitingStake: "0",
            userWithdrawOnlyStake: "0",
            claimableRewards: "100",
            userUndelegatedList: [],
          },
        ],
        isGuarded: true,
      };

      const result = toMultiversXResourcesRaw(resources);

      expect(result).toEqual({
        nonce: 10,
        delegations: resources.delegations,
        isGuarded: true,
      });
    });
  });

  describe("fromMultiversXResourcesRaw", () => {
    it("converts raw resources to typed format", () => {
      const rawResources: MultiversXResourcesRaw = {
        nonce: 5,
        delegations: [],
        isGuarded: false,
      };

      const result = fromMultiversXResourcesRaw(rawResources);

      expect(result).toEqual({
        nonce: 5,
        delegations: [],
        isGuarded: false,
      });
    });
  });

  describe("assignToAccountRaw", () => {
    it("assigns multiversx resources to raw account", () => {
      const account = {
        multiversxResources: {
          nonce: 3,
          delegations: [],
          isGuarded: false,
        },
      } as MultiversXAccount;

      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account, accountRaw);

      expect((accountRaw as MultiversXAccountRaw).multiversxResources).toEqual({
        nonce: 3,
        delegations: [],
        isGuarded: false,
      });
    });

    it("does nothing when multiversxResources is undefined", () => {
      const account = {} as Account;
      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account, accountRaw);

      expect((accountRaw as MultiversXAccountRaw).multiversxResources).toBeUndefined();
    });
  });

  describe("assignFromAccountRaw", () => {
    it("assigns multiversx resources from raw account", () => {
      const accountRaw = {
        multiversxResources: {
          nonce: 7,
          delegations: [],
          isGuarded: true,
        },
      } as MultiversXAccountRaw;

      const account = {} as Account;

      assignFromAccountRaw(accountRaw, account);

      expect((account as MultiversXAccount).multiversxResources).toEqual({
        nonce: 7,
        delegations: [],
        isGuarded: true,
      });
    });

    it("does nothing when raw multiversxResources is undefined", () => {
      const accountRaw = {} as AccountRaw;
      const account = {} as Account;

      assignFromAccountRaw(accountRaw, account);

      expect((account as MultiversXAccount).multiversxResources).toBeUndefined();
    });
  });

  describe("fromOperationExtraRaw", () => {
    it("converts raw operation extra with amount", () => {
      const extraRaw: MultiversXOperationExtraRaw = {
        amount: "1000000000000000000",
      };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.amount).toBeInstanceOf(BigNumber);
      expect(result.amount?.toString()).toBe("1000000000000000000");
    });

    it("returns empty object for non-multiversx extra", () => {
      const extraRaw = { someOtherField: "value" };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result).toEqual({});
    });

    it("returns empty object when amount is not present", () => {
      const extraRaw: MultiversXOperationExtraRaw = {};

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.amount).toBeUndefined();
    });
  });

  describe("toOperationExtraRaw", () => {
    it("converts operation extra with amount to raw", () => {
      const extra: MultiversXOperationExtra = {
        amount: new BigNumber("5000000000000000000"),
      };

      const result = toOperationExtraRaw(extra);

      expect(result.amount).toBe("5000000000000000000");
    });

    it("returns empty object for non-multiversx extra", () => {
      const extra = { someOtherField: "value" };

      const result = toOperationExtraRaw(extra);

      expect(result).toEqual({});
    });

    it("returns empty object when amount is not present", () => {
      const extra: MultiversXOperationExtra = {};

      const result = toOperationExtraRaw(extra);

      expect(result.amount).toBeUndefined();
    });
  });
});
