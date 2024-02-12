import BigNumber from "bignumber.js";
import { buildTransaction, txToMessages } from "./js-buildTransaction";
import { CosmosAccount, CosmosDelegationInfo, Transaction } from "./types";
import {
  MsgDelegate,
  MsgUndelegate,
  MsgBeginRedelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";

import { cosmos } from "@keplr-wallet/cosmos";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Fee } from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";

const veryBigNumber = new BigNumber(3333300000000000000000);

describe("txToMessages", () => {
  const transaction: Transaction = {} as Transaction;
  const account: CosmosAccount = {
    freshAddress: "accAddress",
    currency: { units: [{ code: "atom" }, { code: "uatom" }] },
  } as CosmosAccount;

  describe("When transaction mode is send", () => {
    beforeEach(() => {
      transaction.mode = "send";
    });

    describe("Amino", () => {
      it("should return a MsgSend message if transaction is complete", () => {
        transaction.recipient = "address";
        transaction.amount = new BigNumber(1000);
        const { aminoMsgs } = txToMessages(account, transaction);
        const [aminoMsg] = aminoMsgs;
        expect(aminoMsg).toBeTruthy();
        expect(aminoMsg.type).toContain("MsgSend");
        expect(aminoMsg.value.to_address).toEqual(transaction.recipient);
        expect(aminoMsg.value.from_address).toEqual(account.freshAddress);
        expect(aminoMsg.value.amount[0].amount).toEqual(transaction.amount.toFixed());
        expect(aminoMsg.value.amount[0].denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.recipient = "address";
        transaction.amount = veryBigNumber;
        const { aminoMsgs } = txToMessages(account, transaction);
        const [aminoMsg] = aminoMsgs;
        expect(aminoMsg.value.amount[0].amount.includes("e")).toEqual(false);
      });

      it("should return no message if recipient isn't defined", () => {
        transaction.amount = new BigNumber(10);
        transaction.recipient = "";
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is zero", () => {
        transaction.amount = new BigNumber(0);
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is negative", () => {
        transaction.amount = new BigNumber(-10);
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is negative", () => {
        transaction.amount = new BigNumber(-10);
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgSend message if transaction is complete", () => {
        transaction.recipient = "address";
        transaction.amount = new BigNumber(1000);
        const { protoMsgs } = txToMessages(account, transaction);
        const [protoMsg] = protoMsgs;
        const value = cosmos.bank.v1beta1.MsgSend.decode(protoMsg.value);
        expect(protoMsg).toBeTruthy();
        expect(protoMsg.typeUrl).toContain("MsgSend");
        expect(value.toAddress).toEqual(transaction.recipient);
        expect(value.fromAddress).toEqual(account.freshAddress);
        expect(value.amount[0].amount).toEqual(transaction.amount.toFixed());
        expect(value.amount[0].denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.recipient = "address";
        transaction.amount = veryBigNumber;
        const { protoMsgs } = txToMessages(account, transaction);
        const [protoMsg] = protoMsgs;
        const value = cosmos.bank.v1beta1.MsgSend.decode(protoMsg.value);
        expect(value.amount[0].amount?.includes("e")).toEqual(false);
      });

      it("should return no message if recipient isn't defined", () => {
        transaction.amount = new BigNumber(10);
        transaction.recipient = "";
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is zero", () => {
        transaction.amount = new BigNumber(0);
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is negative", () => {
        transaction.amount = new BigNumber(-10);
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });

  describe("When transaction mode is delegate", () => {
    beforeEach(() => {
      transaction.mode = "delegate";
    });

    describe("Amino", () => {
      it("should return a MsgDelegate message if transaction is complete", () => {
        transaction.amount = new BigNumber(1000);
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message).toBeTruthy();
        expect(message.type).toContain("MsgDelegate");
        expect(message.value.validator_address).toEqual(transaction.validators[0].address);
        expect(message.value.delegator_address).toEqual(account.freshAddress);
        expect(message.value.amount?.amount).toEqual(transaction.amount.toFixed());
        expect(message.value.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.recipient = "address";
        transaction.amount = veryBigNumber;
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message.value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if tx has a 0 amount", () => {
        transaction.amount = new BigNumber(0);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if tx has a negative amount", () => {
        transaction.amount = new BigNumber(-1);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validators has no address", () => {
        transaction.validators = [{} as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgDelegate message if transaction is complete", () => {
        transaction.amount = new BigNumber(1000);
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        expect(message).toBeTruthy();
        expect(message.typeUrl).toContain("MsgDelegate");
        const value = MsgDelegate.decode(message.value);
        expect(value.validatorAddress).toEqual(transaction.validators[0].address);
        expect(value.delegatorAddress).toEqual(account.freshAddress);
        expect(value.amount?.amount).toEqual(transaction.amount.toFixed());
        expect(value.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.amount = veryBigNumber;
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        const value = MsgDelegate.decode(message.value);
        expect(value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if tx has a 0 amount", () => {
        transaction.amount = new BigNumber(0);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if tx has a negative amount", () => {
        transaction.amount = new BigNumber(-1);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validators has no address", () => {
        transaction.validators = [{} as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });

  describe("When transaction mode is undelegate", () => {
    beforeEach(() => {
      transaction.mode = "undelegate";
    });

    describe("Amino", () => {
      it("should return a MsgUndelegate message if transaction is complete", () => {
        transaction.amount = new BigNumber(1000);
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message).toBeTruthy();
        expect(message.type).toContain("MsgUndelegate");
        expect(message.value.validator_address).toEqual(transaction.validators[0].address);
        expect(message.value.delegator_address).toEqual(account.freshAddress);
        expect(message.value.amount?.amount).toEqual(transaction.validators[0].amount.toFixed());
        expect(message.value.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.amount = veryBigNumber;
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message.value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgUndelegate message if transaction is complete", () => {
        transaction.amount = new BigNumber(1000);
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        expect(message).toBeTruthy();
        expect(message.typeUrl).toContain("MsgUndelegate");
        const value = MsgUndelegate.decode(message.value);
        expect(value.validatorAddress).toEqual(transaction.validators[0].address);
        expect(value.delegatorAddress).toEqual(account.freshAddress);
        expect(value.amount?.amount).toEqual(transaction.validators[0].amount.toFixed());
        expect(value.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.amount = veryBigNumber;
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        const value = MsgUndelegate.decode(message.value);
        expect(value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });

  describe("When transaction mode is redelegate", () => {
    beforeEach(() => {
      transaction.mode = "redelegate";
    });

    describe("Amino", () => {
      it("should return a MsgBeginRedelegate message if transaction is complete", () => {
        transaction.sourceValidator = "source";
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message).toBeTruthy();
        expect(message.type).toContain("MsgBeginRedelegate");
        expect(message.value.validator_src_address).toEqual(transaction.sourceValidator);
        expect(message.value.validator_dst_address).toEqual(transaction.validators[0].address);
        expect(message.value.delegator_address).toEqual(account.freshAddress);
        expect(message.value.amount.amount).toEqual(transaction.validators[0].amount.toFixed());
        expect(message.value.amount.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.sourceValidator = "source";
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message.value.amount.amount.includes("e")).toEqual(false);
      });

      it("should return no message if sourceValidator isn't defined", () => {
        transaction.sourceValidator = "";
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgBeginRedelegate message if transaction is complete", () => {
        transaction.sourceValidator = "source";
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        expect(message).toBeTruthy();
        expect(message.typeUrl).toContain("MsgBeginRedelegate");
        const value = MsgBeginRedelegate.decode(message.value);
        expect(value.validatorSrcAddress).toEqual(transaction.sourceValidator);
        expect(value.validatorDstAddress).toEqual(transaction.validators[0].address);
        expect(value.delegatorAddress).toEqual(account.freshAddress);
        expect(value.amount?.amount).toEqual(transaction.validators[0].amount.toFixed());
        expect(value.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.sourceValidator = "source";
        transaction.validators = [
          {
            address: "realAddressTrustMe",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        expect(message).toBeTruthy();
        const value = MsgBeginRedelegate.decode(message.value);
        expect(value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if sourceValidator isn't defined", () => {
        transaction.sourceValidator = "";
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });

  describe("When transaction mode is claimReward", () => {
    beforeEach(() => {
      transaction.mode = "claimReward";
    });

    describe("Amino", () => {
      it("should return a MsgWithdrawDelegationReward message if transaction is complete", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [message] = aminoMsgs;
        expect(message).toBeTruthy();
        expect(message.type).toContain("MsgWithdrawDelegationReward");
        expect(message.value.validator_address).toEqual(transaction.validators[0].address);
        expect(message.value.delegator_address).toEqual(account.freshAddress);
      });

      it("should return no message if validator isn't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgWithdrawDelegatorReward message if transaction is complete", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [message] = protoMsgs;
        expect(message).toBeTruthy();
        expect(message.typeUrl).toContain("MsgWithdrawDelegatorReward");
        const value = MsgWithdrawDelegatorReward.decode(message.value);
        expect(value.validatorAddress).toEqual(transaction.validators[0].address);
        expect(value.delegatorAddress).toEqual(account.freshAddress);
      });

      it("should return no message if validator isn't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });

  describe("When transaction mode is claimRewardCompound", () => {
    beforeEach(() => {
      transaction.mode = "claimRewardCompound";
    });

    describe("Amino", () => {
      it("should return a MsgWithdrawDelegationReward message and a MsgDelegate if transaction is complete", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [withDrawMessage, delegateMessage] = aminoMsgs;
        expect(withDrawMessage).toBeTruthy();
        expect(withDrawMessage.type).toContain("MsgWithdrawDelegationReward");
        expect(withDrawMessage.value.validator_address).toEqual(transaction.validators[0].address);
        expect(withDrawMessage.value.delegator_address).toEqual(account.freshAddress);
        expect(delegateMessage).toBeTruthy();
        expect(delegateMessage.type).toContain("MsgDelegate");
        expect(delegateMessage.value.validator_address).toEqual(transaction.validators[0].address);
        expect(delegateMessage.value.delegator_address).toEqual(account.freshAddress);
        expect(delegateMessage.value.amount.amount).toEqual(
          transaction.validators[0].amount.toFixed(),
        );
        expect(delegateMessage.value.amount.denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction);
        const [, delegateMessage] = aminoMsgs;
        expect(delegateMessage.value.amount.amount.includes("e")).toEqual(false);
      });
    });

    describe("Proto", () => {
      it("should return a MsgWithdrawDelegatorReward message and a MsgDelegate if transaction is complete", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [withDrawMessage, delegateMessage] = protoMsgs;
        expect(withDrawMessage).toBeTruthy();
        expect(withDrawMessage.typeUrl).toContain("MsgWithdrawDelegatorReward");
        const withDrawMessageValue = MsgWithdrawDelegatorReward.decode(withDrawMessage.value);
        expect(withDrawMessageValue.validatorAddress).toEqual(transaction.validators[0].address);
        expect(withDrawMessageValue.delegatorAddress).toEqual(account.freshAddress);
        expect(delegateMessage).toBeTruthy();
        expect(delegateMessage.typeUrl).toContain("MsgDelegate");
        const delegateMessageValue = MsgDelegate.decode(delegateMessage.value);
        expect(delegateMessageValue.validatorAddress).toEqual(transaction.validators[0].address);
        expect(delegateMessageValue.delegatorAddress).toEqual(account.freshAddress);
        expect(delegateMessageValue.amount?.amount).toEqual(
          transaction.validators[0].amount.toFixed(),
        );
        expect(delegateMessageValue.amount?.denom).toEqual(account.currency.units[1].code);
      });

      it("should return a MsgWithdrawDelegatorReward message and a MsgDelegate if transaction is complete", () => {
        transaction.validators = [
          {
            address: "iAmAValidatorAddress",
            amount: veryBigNumber,
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction);
        const [, delegateMessage] = protoMsgs;
        const delegateMessageValue = MsgDelegate.decode(delegateMessage.value);
        expect(delegateMessageValue.amount?.amount.includes("e")).toEqual(false);
      });
    });
  });

  describe("When transaction mode isn't known", () => {
    describe("Amino", () => {
      it("should return no message", () => {
        // @ts-expect-error Random mode that isn't listed in typescript type
        transaction.mode = "RandomModeThatICreatedMyself";
        const { aminoMsgs } = txToMessages(account, transaction);
        expect(aminoMsgs.length).toEqual(0);
      });
    });
    describe("Proto", () => {
      it("should return no message", () => {
        // @ts-expect-error Random mode that isn't listed in typescript type
        transaction.mode = "RandomModeThatICreatedMyself";
        const { protoMsgs } = txToMessages(account, transaction);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });
});

describe("buildTransaction", () => {
  let bodyFromPartialSpy: jest.SpyInstance;
  let feeFromPartialSpy: jest.SpyInstance;
  let txRawEncodeSpy: jest.SpyInstance;

  const defaultInfos = {
    memo: "test",
    pubKey: "pubkey",
    sequence: "1",
    protoMsgs: [],
    pubKeyType: "type",
    signature: new Uint8Array(),
    feeAmount: undefined,
    gasLimit: undefined,
  };

  beforeEach(() => {
    bodyFromPartialSpy = jest.spyOn(TxBody, "fromPartial");
    feeFromPartialSpy = jest.spyOn(Fee, "fromPartial");
    txRawEncodeSpy = jest.spyOn(TxRaw, "encode");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set memo", () => {
    buildTransaction({ ...defaultInfos, memo: "toto" });
    expect(bodyFromPartialSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        memo: "toto",
      }),
    );
  });

  it("should set gasLimit", () => {
    buildTransaction({ ...defaultInfos, gasLimit: "10" });
    expect(feeFromPartialSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        gasLimit: "10",
      }),
    );
  });

  it("should set messages", () => {
    buildTransaction({
      ...defaultInfos,
      protoMsgs: [
        {
          typeUrl: "typeUrl",
          value: new Uint8Array(),
        },
      ],
    });
    expect(bodyFromPartialSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            typeUrl: "typeUrl",
            value: new Uint8Array(),
          },
        ],
      }),
    );
  });

  it("should set signature", () => {
    const signature = new Uint8Array([8]);
    buildTransaction({
      ...defaultInfos,
      signature,
    });
    expect(txRawEncodeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ signatures: [signature] }),
    );
  });
});
