import BigNumber from "bignumber.js";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { Transaction } from "./types";
import { buildTransaction } from "./buildTransaction";
import { types as TyphonTypes } from "@stricahq/typhonjs";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";

describe("buildTransaction", () => {
  const txPayload: Transaction = {
    family: "cardano",
    recipient:
      "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
    amount: new BigNumber(2e6),
    mode: "send",
    poolId: undefined,
    protocolParams: getProtocolParamsFixture(),
  };

  describe("certificates", () => {
    it("should not add abstain when there is no delegation", async () => {
      // account with no delegation
      const account = getCardanoAccountFixture({ delegation: undefined });
      const transaction = await buildTransaction(account, txPayload);
      const certificates = transaction.getCertificates();
      expect(certificates).toEqual([]);
    });

    it("should not add abstain when there is no rewards", async () => {
      const account = getCardanoAccountFixture({
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
      const account = getCardanoAccountFixture({
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
      const account = getCardanoAccountFixture({
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
      const account = getCardanoAccountFixture({ delegation: undefined });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(0);
    });

    it("should not add withdrawal if no rewards", async () => {
      const account = getCardanoAccountFixture({
        delegation: {
          rewards: new BigNumber(0), // no rewards
        },
      });
      const transaction = await buildTransaction(account, txPayload);
      const withdrawals = transaction.getWithdrawals();
      expect(withdrawals.length).toBe(0);
    });

    it("should not add withdrawal when dRepHex is absent", async () => {
      const account = getCardanoAccountFixture({
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
      const account = getCardanoAccountFixture({
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

  describe("undelegate transaction", () => {
    it("should build a undelegate transaction with correct deposit", async () => {
      const account = getCardanoAccountFixture({
        delegation: {
          status: true,
          deposit: (3e6).toString(),
          rewards: new BigNumber(0),
        },
      });
      const txPayloadUndelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "undelegate",
        poolId: undefined,
        protocolParams: getProtocolParamsFixture(),
      };
      const transaction = await buildTransaction(account, txPayloadUndelegate);
      const deregisterCertificate = transaction
        .getCertificates()
        .find(c => c.type === TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION) as
        | TyphonTypes.StakeKeyDeRegistrationCertificate
        | undefined;

      expect(deregisterCertificate).toBeDefined();
      expect(deregisterCertificate!.cert.deposit.toString()).toBe(
        account.cardanoResources.delegation?.deposit,
      );
    });
  });

  describe("delegate transaction", () => {
    it("should build delegate transaction with stake key registration", async () => {
      const account = getCardanoAccountFixture({
        delegation: undefined, // stake key not registered
      });
      const txPayloadDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "delegate",
        poolId: "7df262feae9201d1b2e32d4c825ca91b29fbafb2b8e556f6efb7f549",
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadDelegate);
      const registerCertificate = transaction
        .getCertificates()
        .find(c => c.type === TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION) as
        | TyphonTypes.StakeKeyRegistrationCertificate
        | undefined;

      expect(registerCertificate).toBeDefined();
      expect(registerCertificate!.cert.deposit.toString()).toBe(
        transaction.protocolParams.stakeKeyDeposit.toString(),
      );
    });

    it("should build delegate transaction without stake key registration", async () => {
      const account = getCardanoAccountFixture({
        delegation: {
          status: true, // stake key already registered
          deposit: (2e6).toString(),
          rewards: new BigNumber(0),
        },
      });
      const txPayloadDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "delegate",
        poolId: "7df262feae9201d1b2e32d4c825ca91b29fbafb2b8e556f6efb7f549",
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadDelegate);
      const registerCertificate = transaction
        .getCertificates()
        .find(c => c.type === TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION) as
        | TyphonTypes.StakeKeyRegistrationCertificate
        | undefined;

      expect(registerCertificate).toBeUndefined();
    });
  });
});
