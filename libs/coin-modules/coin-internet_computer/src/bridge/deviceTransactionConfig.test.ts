import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { getEmptyAccount, ICP_CURRENCY_MOCK } from "../test/__fixtures__";
import { Transaction, TransactionStatus } from "../types";
import BigNumber from "bignumber.js";
import { KNOWN_TOPICS } from "../consts";
import { nowInSeconds } from "@zondax/ledger-live-icp/utils";

describe("getDeviceTransactionConfig", () => {
  const account = getEmptyAccount(ICP_CURRENCY_MOCK);
  const parentAccount = null;
  const status: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber("10000"),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  it("should return the base fields for a simple send transaction", () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber("100000000"), // 1 ICP
      fees: new BigNumber("10000"),
      recipient: "recipient_address",
    };

    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
      status,
    });

    expect(fields).toContainEqual({
      type: "text",
      label: "Transaction Type",
      value: "Send ICP",
    });
    expect(fields).toContainEqual({
      type: "text",
      label: "Amount (ICP)",
      value: "1",
    });
    expect(fields).toContainEqual({
      type: "text",
      label: "Maximum fee (ICP)",
      value: "0.0001",
    });
    expect(fields.find(f => f.label === "Memo")).toBeUndefined();
  });

  it("should include memo if it exists and is not '0'", () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber("100000000"),
      fees: new BigNumber("10000"),
      recipient: "recipient_address",
      memo: "12345",
    };

    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
      status,
    });

    expect(fields).toContainEqual({
      type: "text",
      label: "Memo",
      value: "12345",
    });
  });

  it("should not include memo if it is '0'", () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber("100000000"),
      fees: new BigNumber("10000"),
      recipient: "recipient_address",
      memo: "0",
    };

    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
      status,
    });

    expect(fields.find(f => f.label === "Memo")).toBeUndefined();
  });

  it("should not include amount fields if amount is zero", () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber(0),
      fees: new BigNumber("10000"),
      recipient: "recipient_address",
    };

    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
      status,
    });

    expect(fields.find(f => f.label === "Amount (ICP)")).toBeUndefined();
    expect(fields.find(f => f.label === "Maximum fee (ICP)")).toBeUndefined();
  });

  describe("Neuron transactions", () => {
    const baseNeuronTx: Omit<Transaction, "type" | "mode"> = {
      family: "internet_computer",
      amount: new BigNumber(0),
      fees: new BigNumber("10000"),
      recipient: "",
      neuronId: "123456789",
    };

    it('should handle "stake_maturity" transaction with a given percentage', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "stake_maturity",
        percentageToStake: "50",
      };

      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });

      expect(fields).toContainEqual({
        type: "text",
        label: "Neuron Id",
        value: "123456789",
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Transaction Type",
        value: "Stake Maturity",
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Percentage to Stake",
        value: "50",
      });
    });

    it('should handle "stake_maturity" transaction with default percentage', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "stake_maturity",
      };

      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });

      expect(fields).toContainEqual({
        type: "text",
        label: "Percentage to Stake",
        value: "100",
      });
    });

    it('should handle "remove_hot_key" transaction', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "remove_hot_key",
        hotKeyToRemove: "principal_to_remove",
      };

      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });

      expect(fields).toContainEqual({
        type: "text",
        label: "Principal",
        value: "principal_to_remove",
      });
    });

    it('should handle "add_hot_key" transaction', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "add_hot_key",
        hotKeyToAdd: "principal_to_add",
      };

      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });

      expect(fields).toContainEqual({
        type: "text",
        label: "Principal",
        value: "principal_to_add",
      });
    });

    it('should handle "auto_stake_maturity" transaction', () => {
      const transactionTrue: Transaction = {
        ...baseNeuronTx,
        type: "auto_stake_maturity",
        autoStakeMaturity: true,
      };
      const fieldsTrue = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction: transactionTrue,
        status,
      });
      expect(fieldsTrue).toContainEqual({
        type: "text",
        label: "Auto Stake",
        value: "true",
      });

      const transactionFalse: Transaction = {
        ...transactionTrue,
        autoStakeMaturity: false,
      };
      const fieldsFalse = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction: transactionFalse,
        status,
      });
      expect(fieldsFalse).toContainEqual({
        type: "text",
        label: "Auto Stake",
        value: "false",
      });
    });

    it('should handle "spawn_neuron" transaction', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "spawn_neuron",
      };
      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Controller",
        value: "self",
      });
    });

    it('should handle "disburse" transaction', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "disburse",
      };
      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Disburse To",
        value: "Self",
      });
    });

    it('should handle "set_dissolve_delay" transaction', () => {
      const dissolveDelay = new BigNumber(3600 * 24 * 365); // 1 year in seconds
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "set_dissolve_delay",
        dissolveDelay: dissolveDelay.toString(),
      };

      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });

      const expectedDate = new Date(dissolveDelay.plus(nowInSeconds()).times(1000).toNumber())
        .toISOString()
        .split("T")[0];

      expect(fields).toContainEqual({
        type: "text",
        label: "Dissolve Date",
        value: expectedDate,
      });
    });

    it('should handle "follow" transaction with topic', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "follow",
        followTopic: 1, // Corresponds to GOVERNANCE
      };
      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Topic",
        value: KNOWN_TOPICS[1],
      });
    });

    it('should handle "follow" transaction with followees', () => {
      const transaction: Transaction = {
        ...baseNeuronTx,
        type: "follow",
        followeesIds: ["100", "200", "300"],
      };
      const fields = getDeviceTransactionConfig({
        account,
        parentAccount,
        transaction,
        status,
      });
      expect(fields).toContainEqual({
        type: "text",
        label: "Followees",
        value: "100, 200, 300",
      });
    });
  });
});
