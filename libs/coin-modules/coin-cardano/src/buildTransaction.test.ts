import { types as TyphonTypes } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { CardanoMinAmountError } from "./errors";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import { Transaction } from "./types";

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

  describe("send all (useAllAmount)", () => {
    const sendAllPayload: Transaction = {
      ...txPayload,
      amount: new BigNumber(0),
      useAllAmount: true,
    };

    it("sends the full balance minus a realistic fee, not the whole balance as fee (LIVE-33176)", async () => {
      // Fixture holds a single 100 ADA UTXO.
      const account = getCardanoAccountFixture({ delegation: undefined });
      account.cardanoResources.protocolParams = getProtocolParamsFixture();

      const transaction = await buildTransaction(account, sendAllPayload);

      const fee = transaction.getFee();
      // The real linear fee is well under 1 ADA; the dust-guard bug set it to the whole ~balance.
      expect(fee.lt(1e6)).toBe(true);

      const outputs = transaction.getOutputs();
      expect(outputs).toHaveLength(1);
      // Recipient receives balance − fee, and inputs balance outputs + fee exactly.
      expect(outputs[0].amount.plus(fee).toString()).toBe((100e6).toString());
    });

    it("throws CardanoMinAmountError when the balance is below the dust threshold and cannot be sent", async () => {
      const account = getCardanoAccountFixture({ delegation: undefined });
      account.cardanoResources.protocolParams = getProtocolParamsFixture();
      account.balance = new BigNumber(1e6);
      account.spendableBalance = new BigNumber(1e6);
      // A ~1 ADA balance: after fees the leftover is below the Babbage min-UTXO floor, so no valid
      // output can be created. The fix surfaces this clearly instead of folding it into the fee.
      account.cardanoResources.utxos = [
        { ...account.cardanoResources.utxos[0], amount: new BigNumber(1e6) },
      ];

      await expect(buildTransaction(account, sendAllPayload)).rejects.toBeInstanceOf(
        CardanoMinAmountError,
      );
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

  describe("frozen account state — UTXO selection must not sort in place", () => {
    const deepFreeze = <T>(value: T): T => {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
      }
      return value;
    };

    const makeTwoUtxos = () => [
      {
        hash: "e807160f59455ffc011e6d0a48c0922645797707b8520788f176ca21f2b49561",
        index: 0,
        address:
          "00bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07db5e8ece0982acc4883de67c2e3411cc26bd56686a162074998c02bc",
        amount: new BigNumber(20e6),
        tokens: [],
        paymentCredential: {
          key: "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07", // gitleaks:allow
          path: { account: 0, chain: 0, coin: 1815, index: 0, purpose: 1852 },
        },
      },
      {
        hash: "f918271a6a566aad122f7e1b59d1a33756808818c9631899a287db32e3c5a672",
        index: 1,
        address:
          "00bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07db5e8ece0982acc4883de67c2e3411cc26bd56686a162074998c02bc",
        amount: new BigNumber(100e6),
        tokens: [],
        paymentCredential: {
          key: "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07", // gitleaks:allow
          path: { account: 0, chain: 0, coin: 1815, index: 0, purpose: 1852 },
        },
      },
    ];

    it("builds a send transaction without mutating the frozen utxo array", async () => {
      const account = deepFreeze(
        getCardanoAccountFixture({ delegation: undefined, utxos: makeTwoUtxos() }),
      );
      await expect(buildTransaction(account, txPayload)).resolves.toBeDefined();
    });

    it("builds a send-all transaction without mutating the frozen utxo array", async () => {
      const account = deepFreeze(
        getCardanoAccountFixture({ delegation: undefined, utxos: makeTwoUtxos() }),
      );
      await expect(
        buildTransaction(account, { ...txPayload, useAllAmount: true }),
      ).resolves.toBeDefined();
    });

    it("builds a delegate transaction without mutating the frozen utxo array", async () => {
      const account = deepFreeze(
        getCardanoAccountFixture({
          delegation: { status: true, deposit: (2e6).toString(), rewards: new BigNumber(0) },
          utxos: makeTwoUtxos(),
        }),
      );
      await expect(
        buildTransaction(account, {
          ...txPayload,
          recipient: "",
          amount: new BigNumber(0),
          mode: "delegate",
          poolId: "7df262feae9201d1b2e32d4c825ca91b29fbafb2b8e556f6efb7f549",
        }),
      ).resolves.toBeDefined();
    });

    it("builds an undelegate transaction without mutating the frozen utxo array", async () => {
      const account = deepFreeze(
        getCardanoAccountFixture({
          delegation: { status: true, deposit: (2e6).toString(), rewards: new BigNumber(0) },
          utxos: makeTwoUtxos(),
        }),
      );
      await expect(
        buildTransaction(account, {
          ...txPayload,
          recipient: "",
          amount: new BigNumber(0),
          mode: "undelegate",
        }),
      ).resolves.toBeDefined();
    });

    it("builds a token-send transaction without mutating the frozen utxo/token arrays", async () => {
      const policyId = "a".repeat(56);
      const assetName = "74657374";
      const tokenId = `cardano/native/${policyId}${assetName}`;
      const tokenUtxos = makeTwoUtxos().map(u => ({
        ...u,
        tokens: [{ policyId, assetName, amount: new BigNumber(1000) }],
      }));

      const account = getCardanoAccountFixture({ delegation: undefined, utxos: tokenUtxos });
      account.cardanoResources.protocolParams = getProtocolParamsFixture();
      account.subAccounts = [
        {
          type: "TokenAccount",
          id: "token-account-1",
          token: { id: tokenId },
          balance: new BigNumber(1000),
        } as any,
      ];
      deepFreeze(account);

      await expect(
        buildTransaction(account, {
          ...txPayload,
          subAccountId: "token-account-1",
          amount: new BigNumber(500),
        }),
      ).resolves.toBeDefined();
    });
  });
});
