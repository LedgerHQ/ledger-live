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

  describe("vote delegate transaction", () => {
    it("should skip default abstain vote with voteDelegate tx", async () => {
      // scenario when it might add default abstain vote
      const account = getCardanoAccountFixture({
        delegation: {
          status: true, // stake key already registered
          dRepHex: undefined, // drepHex absent
          rewards: new BigNumber(10e6), // rewards available
        },
      });
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepHex: "22aabbcc",
        protocolParams: getProtocolParamsFixture(),
      };
      const transaction = await buildTransaction(account, txPayloadVoteDelegate);
      const certificates = transaction.getCertificates();
      expect(certificates.length).toBe(1);
      expect(certificates[0].type).toBe(TyphonTypes.CertificateType.VOTE_DELEGATION);
      const voteDelegationCertificate = certificates[0] as TyphonTypes.VoteDelegationCertificate;
      expect(voteDelegationCertificate.cert.dRep.key?.toString("hex")).toBe("aabbcc");
    });

    it("should build vote delegate transaction with stake key registration", async () => {
      /**
       * if stake key is not already registered
       * it should add stake key registration certificate along with vote delegation certificate
       */
      const account = getCardanoAccountFixture({
        delegation: undefined, // stake key not registered
      });
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepHex: "22bbccdd",
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadVoteDelegate);
      const certificates = transaction.getCertificates();

      // only two certificates should be present (stake key registration + vote delegation)
      expect(certificates.length).toBe(2);

      const registerCertificate = certificates.find(
        c => c.type === TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
      ) as TyphonTypes.StakeKeyRegistrationCertificate | undefined;

      const voteDelegateCertificate = certificates.find(
        c => c.type === TyphonTypes.CertificateType.VOTE_DELEGATION,
      ) as TyphonTypes.VoteDelegationCertificate | undefined;

      // should have stake key registration certificate
      expect(registerCertificate).toBeDefined();
      expect(registerCertificate!.cert.deposit.toString()).toBe(
        transaction.protocolParams.stakeKeyDeposit.toString(),
      );
      // should have vote delegation certificate
      expect(voteDelegateCertificate).toBeDefined();
      expect(voteDelegateCertificate?.cert.dRep.key?.toString("hex")).toBe("bbccdd");
    });

    it("should build vote delegate transaction without stake key registration", async () => {
      /**
       * if stake key is already registed it should only add vote delegation certificate
       */
      const account = getCardanoAccountFixture({
        delegation: {
          status: true, // stake key already registered
          deposit: (2e6).toString(),
          rewards: new BigNumber(0),
        },
      });
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepHex: "22aacc",
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadVoteDelegate);
      const certificates = transaction.getCertificates();

      // only one certificate should be present (vote delegation)
      expect(certificates.length).toBe(1);

      const registerCertificate = certificates.find(
        c => c.type === TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
      ) as TyphonTypes.StakeKeyRegistrationCertificate | undefined;

      const voteDelegateCertificate = certificates.find(
        c => c.type === TyphonTypes.CertificateType.VOTE_DELEGATION,
      ) as TyphonTypes.VoteDelegationCertificate | undefined;

      expect(registerCertificate).toBeUndefined(); // should not have stake key registration certificate
      expect(voteDelegateCertificate).toBeDefined(); // should have vote delegation certificate
      expect(voteDelegateCertificate?.cert.dRep.key?.toString("hex")).toBe("aacc");
    });

    it("should add abstain vote certificate", async () => {
      const account = getCardanoAccountFixture({});
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepAbstain: true,
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadVoteDelegate);

      const voteDelegateCertificate = transaction
        .getCertificates()
        .find(c => c.type === TyphonTypes.CertificateType.VOTE_DELEGATION) as
        | TyphonTypes.VoteDelegationCertificate
        | undefined;
      // should have vote delegation certificate
      expect(voteDelegateCertificate).toBeDefined();
      // should have abstain vote
      expect(voteDelegateCertificate?.cert.dRep.type).toBe(TyphonTypes.DRepType.ABSTAIN);
      expect(voteDelegateCertificate?.cert.dRep.key).toBeUndefined();
    });

    it("should add no confidence vote certificate", async () => {
      const account = getCardanoAccountFixture({});
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepNoConfidence: true,
        protocolParams: getProtocolParamsFixture(),
      };

      const transaction = await buildTransaction(account, txPayloadVoteDelegate);

      const voteDelegateCertificate = transaction
        .getCertificates()
        .find(c => c.type === TyphonTypes.CertificateType.VOTE_DELEGATION) as
        | TyphonTypes.VoteDelegationCertificate
        | undefined;
      // should have vote delegation certificate
      expect(voteDelegateCertificate).toBeDefined();
      // should have no confidence vote
      expect(voteDelegateCertificate?.cert.dRep.type).toBe(TyphonTypes.DRepType.NO_CONFIDENCE);
      expect(voteDelegateCertificate?.cert.dRep.key).toBeUndefined();
    });

    it("should throw for invalid dRep hex", async () => {
      const account = getCardanoAccountFixture({});
      const txPayloadVoteDelegate: Transaction = {
        family: "cardano",
        recipient: "",
        amount: new BigNumber(0),
        mode: "voteDelegate",
        poolId: undefined,
        dRepHex: "invalid",
        protocolParams: getProtocolParamsFixture(),
      };

      await expect(buildTransaction(account, txPayloadVoteDelegate)).rejects.toThrow(
        "Invalid dRepHex",
      );
    });
  });
});
