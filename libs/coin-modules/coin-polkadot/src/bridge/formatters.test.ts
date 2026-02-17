/* eslint-disable @typescript-eslint/consistent-type-assertions */

import BigNumber from "bignumber.js";
import { PolkadotAccount } from "../types";
import formatters from "./formatters";

describe("formatters", () => {
  describe("formatAccountSpecifics", () => {
    it("should generate a string with only spendable balance when other fields are not present", () => {
      const account = {
        spendableBalance: new BigNumber(1),

        polkadotResources: {
          lockedBalance: new BigNumber(0),
          unlockedBalance: new BigNumber(0),
        },
        type: "Account",
        currency: {
          units: [{ name: "DOT", code: "DOT", magnitude: 0 }],
        },
      } as PolkadotAccount;

      expect(formatters.formatAccountSpecifics(account)).toBe(" 1 DOT spendable. ");
    });

    it("should generate a complete string with all fields when they are present", () => {
      const account = {
        spendableBalance: new BigNumber(1),

        polkadotResources: {
          lockedBalance: new BigNumber(2),
          unlockedBalance: new BigNumber(3),
          stash: "stash",
          controller: "controller",
          nominations: [
            { address: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS" },
            { address: "5CPZeTRXr1kEqCaEMpPuTdRBYRtzcer7f5qdDiNCig5WaiCV" },
          ],
        },
        type: "Account",
        currency: {
          units: [{ name: "DOT", code: "DOT", magnitude: 0 }],
        },
      } as PolkadotAccount;

      expect(formatters.formatAccountSpecifics(account)).toBe(
        " 1 DOT spendable. 2 DOT locked. 3 DOT unlocked. \nstash : stash\ncontroller : controller\nNominations\n  to 12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS\n  to 5CPZeTRXr1kEqCaEMpPuTdRBYRtzcer7f5qdDiNCig5WaiCV",
      );
    });
  });
});
