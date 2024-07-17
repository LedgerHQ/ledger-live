import { BigNumber } from "bignumber.js";

import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { IconAccount, IconAccountRaw, IconResources, IconResourcesRaw } from "../../types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromIconResourcesRaw,
  toIconResourcesRaw,
} from "../../serialization";

describe("Icon Resources Utilities", () => {
  describe("toIconResourcesRaw", () => {
    it("should convert IconResources to IconResourcesRaw", () => {
      const resources: IconResources = {
        nonce: 1,
        votingPower: new BigNumber(1000),
        totalDelegated: new BigNumber(2000),
      };

      const expectedRaw: IconResourcesRaw = {
        nonce: 1,
        votingPower: "1000",
        totalDelegated: "2000",
      };

      expect(toIconResourcesRaw(resources)).toEqual(expectedRaw);
    });
  });

  describe("fromIconResourcesRaw", () => {
    it("should convert IconResourcesRaw to IconResources", () => {
      const rawResources: IconResourcesRaw = {
        nonce: 1,
        votingPower: "1000",
        totalDelegated: "2000",
      };

      const expectedResources: IconResources = {
        nonce: 1,
        votingPower: new BigNumber(1000),
        totalDelegated: new BigNumber(2000),
      };

      expect(fromIconResourcesRaw(rawResources)).toEqual(expectedResources);
    });
  });

  describe("assignToAccountRaw", () => {
    it("should assign IconResources to AccountRaw", () => {
      const account: IconAccount = {
        iconResources: {
          nonce: 1,
          votingPower: new BigNumber(1000),
          totalDelegated: new BigNumber(2000),
        },
      } as IconAccount;

      const accountRaw: AccountRaw = {} as IconAccountRaw;

      assignToAccountRaw(account as Account, accountRaw);

      expect((accountRaw as IconAccountRaw).iconResources).toEqual({
        nonce: 1,
        votingPower: "1000",
        totalDelegated: "2000",
      });
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should assign IconResourcesRaw to Account", () => {
      const accountRaw = {
        iconResources: {
          nonce: 1,
          votingPower: "1000",
          totalDelegated: "2000",
        },
      } as any;

      const account: Account = {} as IconAccount;

      assignFromAccountRaw(accountRaw as AccountRaw, account);

      expect((account as IconAccount).iconResources).toEqual({
        nonce: 1,
        votingPower: new BigNumber(1000),
        totalDelegated: new BigNumber(2000),
      });
    });
  });
});
