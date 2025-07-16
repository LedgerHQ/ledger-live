import BigNumber from "bignumber.js";
import { getCardanoTestnetAccount } from "./fixtures/accounts";
import { Transaction } from "./types";
import { buildTransaction } from "./buildTransaction";
import { types as TyphonTypes } from "@stricahq/typhonjs";
import { getProtocolParams } from "./fixtures/protocolParams";

describe("buildTransaction", () => {
  const txPayload: Transaction = {
    family: "cardano",
    recipient:
      "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
    amount: new BigNumber(2e6),
    mode: "send",
    poolId: undefined,
    protocolParams: getProtocolParams(),
  };

  describe("certificates", () => {
    it("should not add abstain when there is no delegation", async () => {
      // account with no delegation
      const account = getCardanoTestnetAccount({ delegation: undefined });
      const transaction = await buildTransaction(account, txPayload);
      const certificates = transaction.getCertificates();
      expect(certificates).toEqual([]);
    });

    it("should not add abstain when there is no rewards", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          dRepHex: undefined,
          rewards: new BigNumber(0), // no rewards
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const certificates = transaction.getCertificates();
      expect(certificates).toEqual([]);
    });

    it("should not add abstain vote when dRepHex is present", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          dRepHex: "drepHex", // drepHex present
          rewards: new BigNumber(10e6),
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const certificates = transaction.getCertificates();
      expect(certificates).toEqual([]);
    });

    it("should add abstain when drepHex is absent and rewards is available", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          dRepHex: undefined, // drepHex absent
          rewards: new BigNumber(10e6), // rewards available
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const certificates = transaction.getCertificates();
      expect(
        certificates.some(
          c =>
            c.type === TyphonTypes.CertificateType.VOTE_DELEGATION &&
            c.cert.dRep.type === TyphonTypes.DRepType.ABSTAIN,
        ),
      ).toBe(true);
    });
  });

  describe("withdrawals", () => {
    it("should not add withdrawal when there is no delegation", async () => {
      const account = getCardanoTestnetAccount({ delegation: undefined });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(0);
    });

    it("should not add withdrawal if no rewards", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          rewards: new BigNumber(0), // no rewards
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(0);
    });

    it("should not add withdrawal when dRepHex is absent", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          dRepHex: undefined, // drepHex absent
          rewards: new BigNumber(10e6), // rewards available
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(0);
    });

    it("should add withdrawal when dRepHex and rewards both are available", async () => {
      const account = getCardanoTestnetAccount({
        delegation: {
          dRepHex: "drepHex", // drepHex present
          rewards: new BigNumber(10e6), // rewards available
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(1);
    });
  });
});
