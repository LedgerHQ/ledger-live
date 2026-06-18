import { AminoMsg, makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import { ExtendedSecp256k1Signature, Secp256k1, sha256 } from "@cosmjs/crypto";
import {
  MsgWrappedBeginRedelegate,
  MsgWrappedDelegate,
  MsgWrappedUndelegate,
  protobufPackage as epochingPackage,
} from "@keplr-wallet/proto-types/babylon/epoching/v1/tx";
import { Fee } from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";
import BigNumber from "bignumber.js";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import {
  MsgBeginRedelegate,
  MsgDelegate,
  MsgUndelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import { buildTransaction, txToMessages } from "./buildTransaction";
import Babylon, { BABYLON_STAKING_MESSAGES } from "./chain/Babylon";
import Cosmos from "./chain/Cosmos";
import Zenrock from "./chain/Zenrock";
import { CosmosAccount, CosmosDelegationInfo, Transaction } from "./types";

const veryBigNumber = new BigNumber(3333300000000000000000);
const cosmos = new Cosmos();

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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [aminoMsg] = aminoMsgs;
        expect(aminoMsg.type).toContain("MsgSend");
        expect(aminoMsg.value.to_address).toEqual(transaction.recipient);
        expect(aminoMsg.value.from_address).toEqual(account.freshAddress);
        expect(aminoMsg.value.amount[0].amount).toEqual(transaction.amount.toFixed());
        expect(aminoMsg.value.amount[0].denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.recipient = "address";
        transaction.amount = veryBigNumber;
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [aminoMsg] = aminoMsgs;
        expect(aminoMsg.value.amount[0].amount.includes("e")).toEqual(false);
      });

      it("should return no message if recipient isn't defined", () => {
        transaction.amount = new BigNumber(10);
        transaction.recipient = "";
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is zero", () => {
        transaction.amount = new BigNumber(0);
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is negative", () => {
        transaction.amount = new BigNumber(-10);
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });
    });

    describe("Proto", () => {
      it("should return a MsgSend message if transaction is complete", () => {
        transaction.recipient = "address";
        transaction.amount = new BigNumber(1000);
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [protoMsg] = protoMsgs;
        const value = MsgSend.decode(protoMsg.value);
        expect(protoMsg.typeUrl).toContain("MsgSend");
        expect(value.toAddress).toEqual(transaction.recipient);
        expect(value.fromAddress).toEqual(account.freshAddress);
        expect(value.amount[0].amount).toEqual(transaction.amount.toFixed());
        expect(value.amount[0].denom).toEqual(account.currency.units[1].code);
      });

      it("should not include exponential part on big numbers", () => {
        transaction.recipient = "address";
        transaction.amount = veryBigNumber;
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [protoMsg] = protoMsgs;
        const value = MsgSend.decode(protoMsg.value);
        expect(value.amount[0].amount?.includes("e")).toEqual(false);
      });

      it("should return no message if recipient isn't defined", () => {
        transaction.amount = new BigNumber(10);
        transaction.recipient = "";
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is zero", () => {
        transaction.amount = new BigNumber(0);
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if amount is negative", () => {
        transaction.amount = new BigNumber(-10);
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
        expect(message.value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if tx has a 0 amount", () => {
        transaction.amount = new BigNumber(0);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if tx has a negative amount", () => {
        transaction.amount = new BigNumber(-1);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validators has no address", () => {
        transaction.validators = [{} as CosmosDelegationInfo];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
        const value = MsgDelegate.decode(message.value);
        expect(value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if tx has a 0 amount", () => {
        transaction.amount = new BigNumber(0);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if tx has a negative amount", () => {
        transaction.amount = new BigNumber(-1);
        transaction.validators = [{ address: "realAddressTrustMe" } as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validators has no address", () => {
        transaction.validators = [{} as CosmosDelegationInfo];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
        expect(message.value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
        const value = MsgUndelegate.decode(message.value);
        expect(value.amount?.amount.includes("e")).toEqual(false);
      });

      it("should return no message if validators aren't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(100),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is 0", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(0),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });
      it("should return no message if validator amount is negative", () => {
        transaction.validators = [
          {
            address: "address",
            amount: new BigNumber(-10),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = aminoMsgs;
        expect(message.type).toContain("MsgWithdrawDelegationReward");
        expect(message.value.validator_address).toEqual(transaction.validators[0].address);
        expect(message.value.delegator_address).toEqual(account.freshAddress);
      });

      it("should return no message if validator isn't defined", () => {
        transaction.validators = [];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [message] = protoMsgs;
        expect(message.typeUrl).toContain("MsgWithdrawDelegatorReward");
        const value = MsgWithdrawDelegatorReward.decode(message.value);
        expect(value.validatorAddress).toEqual(transaction.validators[0].address);
        expect(value.delegatorAddress).toEqual(account.freshAddress);
      });

      it("should return no message if validator isn't defined", () => {
        transaction.validators = [];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });

      it("should return no message if validator address isn't defined", () => {
        transaction.validators = [
          {
            address: "",
            amount: new BigNumber(1000),
          } as CosmosDelegationInfo,
        ];
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        const [withDrawMessage, delegateMessage] = aminoMsgs;
        expect(withDrawMessage.type).toContain("MsgWithdrawDelegationReward");
        expect(withDrawMessage.value.validator_address).toEqual(transaction.validators[0].address);
        expect(withDrawMessage.value.delegator_address).toEqual(account.freshAddress);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        const [withDrawMessage, delegateMessage] = protoMsgs;
        expect(withDrawMessage.typeUrl).toContain("MsgWithdrawDelegatorReward");
        const withDrawMessageValue = MsgWithdrawDelegatorReward.decode(withDrawMessage.value);
        expect(withDrawMessageValue.validatorAddress).toEqual(transaction.validators[0].address);
        expect(withDrawMessageValue.delegatorAddress).toEqual(account.freshAddress);
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
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
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
        const { aminoMsgs } = txToMessages(account, transaction, cosmos);
        expect(aminoMsgs.length).toEqual(0);
      });
    });
    describe("Proto", () => {
      it("should return no message", () => {
        // @ts-expect-error Random mode that isn't listed in typescript type
        transaction.mode = "RandomModeThatICreatedMyself";
        const { protoMsgs } = txToMessages(account, transaction, cosmos);
        expect(protoMsgs.length).toEqual(0);
      });
    });
  });
});

describe("txToMessages — babylon epoching wrapping", () => {
  const babylon = new Babylon();
  const delegatorAddress = "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n";
  const validatorAddress = "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t";
  const account = {
    freshAddress: delegatorAddress,
    currency: { id: "babylon", units: [{ code: "BABY" }, { code: "ubbn" }] },
  } as CosmosAccount;

  describe("delegate", () => {
    const transaction = {
      mode: "delegate",
      amount: new BigNumber(399180),
      validators: [
        { address: validatorAddress, amount: new BigNumber(399180) } as CosmosDelegationInfo,
      ],
    } as Transaction;

    it("amino: type /babylon.epoching.v1.MsgWrappedDelegate with the inner MsgDelegate nested under `msg`", () => {
      const { aminoMsgs } = txToMessages(account, transaction, babylon);
      expect(aminoMsgs).toHaveLength(1);
      const [msg] = aminoMsgs;
      expect(msg.type).toEqual("/babylon.epoching.v1.MsgWrappedDelegate");
      expect(msg.value.msg).toEqual({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: { denom: "ubbn", amount: "399180" },
      });
    });

    it("proto: typeUrl /babylon.epoching.v1.MsgWrappedDelegate carrying the inner MsgDelegate", () => {
      const { protoMsgs } = txToMessages(account, transaction, babylon);
      expect(protoMsgs).toHaveLength(1);
      const [msg] = protoMsgs;
      expect(msg.typeUrl).toEqual("/babylon.epoching.v1.MsgWrappedDelegate");
      const decoded = MsgWrappedDelegate.decode(msg.value);
      expect(decoded.msg?.delegatorAddress).toEqual(delegatorAddress);
      expect(decoded.msg?.validatorAddress).toEqual(validatorAddress);
      expect(decoded.msg?.amount).toEqual({ denom: "ubbn", amount: "399180" });
    });

    it("proto: matches the exact wire bytes cross-checked against the live chain", () => {
      const { protoMsgs } = txToMessages(account, transaction, babylon);
      expect(Buffer.from(protoMsgs[0].value).toString("hex")).toEqual(
        "0a6f0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c616334741a0e0a047562626e1206333939313830",
      );
    });
  });

  describe("undelegate", () => {
    const transaction = {
      mode: "undelegate",
      amount: new BigNumber(500),
      validators: [
        { address: validatorAddress, amount: new BigNumber(500) } as CosmosDelegationInfo,
      ],
    } as Transaction;

    it("amino: type /babylon.epoching.v1.MsgWrappedUndelegate with the inner nested under `msg`", () => {
      const { aminoMsgs } = txToMessages(account, transaction, babylon);
      const [msg] = aminoMsgs;
      expect(msg.type).toEqual("/babylon.epoching.v1.MsgWrappedUndelegate");
      expect(msg.value.msg).toEqual({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: { denom: "ubbn", amount: "500" },
      });
    });

    it("proto: typeUrl /babylon.epoching.v1.MsgWrappedUndelegate carrying the inner MsgUndelegate", () => {
      const { protoMsgs } = txToMessages(account, transaction, babylon);
      const [msg] = protoMsgs;
      expect(msg.typeUrl).toEqual("/babylon.epoching.v1.MsgWrappedUndelegate");
      const decoded = MsgWrappedUndelegate.decode(msg.value);
      expect(decoded.msg?.validatorAddress).toEqual(validatorAddress);
      expect(decoded.msg?.amount).toEqual({ denom: "ubbn", amount: "500" });
    });
  });

  describe("redelegate", () => {
    const sourceValidator = "bbnvaloper1srcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrc";
    const transaction = {
      mode: "redelegate",
      sourceValidator,
      amount: new BigNumber(700),
      validators: [
        { address: validatorAddress, amount: new BigNumber(700) } as CosmosDelegationInfo,
      ],
    } as Transaction;

    it("amino: type /babylon.epoching.v1.MsgWrappedBeginRedelegate with the inner nested under `msg`", () => {
      const { aminoMsgs } = txToMessages(account, transaction, babylon);
      const [msg] = aminoMsgs;
      expect(msg.type).toEqual("/babylon.epoching.v1.MsgWrappedBeginRedelegate");
      expect(msg.value.msg).toEqual({
        delegator_address: delegatorAddress,
        validator_src_address: sourceValidator,
        validator_dst_address: validatorAddress,
        amount: { denom: "ubbn", amount: "700" },
      });
    });

    it("proto: typeUrl /babylon.epoching.v1.MsgWrappedBeginRedelegate carrying the inner msg", () => {
      const { protoMsgs } = txToMessages(account, transaction, babylon);
      const [msg] = protoMsgs;
      expect(msg.typeUrl).toEqual("/babylon.epoching.v1.MsgWrappedBeginRedelegate");
      const decoded = MsgWrappedBeginRedelegate.decode(msg.value);
      expect(decoded.msg?.validatorSrcAddress).toEqual(sourceValidator);
      expect(decoded.msg?.validatorDstAddress).toEqual(validatorAddress);
      expect(decoded.msg?.amount).toEqual({ denom: "ubbn", amount: "700" });
    });
  });

  it("claimReward stays on the standard distribution msg (never wrapped)", () => {
    const transaction = {
      mode: "claimReward",
      validators: [{ address: validatorAddress, amount: new BigNumber(0) } as CosmosDelegationInfo],
    } as Transaction;
    const { aminoMsgs, protoMsgs } = txToMessages(account, transaction, babylon);
    expect(aminoMsgs[0].type).toEqual("cosmos-sdk/MsgWithdrawDelegationReward");
    expect(protoMsgs[0].typeUrl).toEqual("/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward");
  });

  it("claimRewardCompound throws instead of building an unwrapped (chain-rejected) delegate", () => {
    const transaction = {
      mode: "claimRewardCompound",
      validators: [
        { address: validatorAddress, amount: new BigNumber(1000) } as CosmosDelegationInfo,
      ],
    } as Transaction;
    expect(() => txToMessages(account, transaction, babylon)).toThrow(/not supported on babylon/);
  });

  it("uses the canonical x/epoching proto type URLs for all three staking msgs (anchored to the keplr package)", () => {
    const canonical = (name: string) => `/${epochingPackage}.${name}`;
    expect(BABYLON_STAKING_MESSAGES.delegate.protoTypeUrl).toEqual(canonical("MsgWrappedDelegate"));
    expect(BABYLON_STAKING_MESSAGES.undelegate.protoTypeUrl).toEqual(
      canonical("MsgWrappedUndelegate"),
    );
    expect(BABYLON_STAKING_MESSAGES.beginRedelegate.protoTypeUrl).toEqual(
      canonical("MsgWrappedBeginRedelegate"),
    );
    // amino type == proto URL for all three (see Babylon.ts; proven for delegate by the fixture below).
    expect(BABYLON_STAKING_MESSAGES.delegate.aminoType).toEqual(
      BABYLON_STAKING_MESSAGES.delegate.protoTypeUrl,
    );
    expect(BABYLON_STAKING_MESSAGES.undelegate.aminoType).toEqual(
      BABYLON_STAKING_MESSAGES.undelegate.protoTypeUrl,
    );
    expect(BABYLON_STAKING_MESSAGES.beginRedelegate.aminoType).toEqual(
      BABYLON_STAKING_MESSAGES.beginRedelegate.protoTypeUrl,
    );
  });
});

describe("txToMessages — zenrock relabels staking msgs without wrapping", () => {
  const zenrock = new Zenrock();
  const validatorAddress = "zenvaloper1validatorvalidatorvalidatorvalida";
  const account = {
    freshAddress: "zen1delegatordelegatordelegatordelegator",
    currency: { id: "zenrock", units: [{ code: "ZEN" }, { code: "uzen" }] },
  } as CosmosAccount;

  it("delegate: zrchain labels and a bare (non-wrapped) value", () => {
    const transaction = {
      mode: "delegate",
      amount: new BigNumber(100),
      validators: [
        { address: validatorAddress, amount: new BigNumber(100) } as CosmosDelegationInfo,
      ],
    } as Transaction;
    const { aminoMsgs, protoMsgs } = txToMessages(account, transaction, zenrock);
    expect(aminoMsgs[0].type).toEqual("zrchain/MsgDelegate");
    expect(aminoMsgs[0].value.msg).toBeUndefined();
    expect(aminoMsgs[0].value.validator_address).toEqual(validatorAddress);
    expect(protoMsgs[0].typeUrl).toEqual("/zrchain.validation.MsgDelegate");
    const decoded = MsgDelegate.decode(protoMsgs[0].value);
    expect(decoded.validatorAddress).toEqual(validatorAddress);
    expect(decoded.amount).toEqual({ denom: "uzen", amount: "100" });
  });

  it("undelegate: zrchain labels and a bare (non-wrapped) value", () => {
    const transaction = {
      mode: "undelegate",
      validators: [
        { address: validatorAddress, amount: new BigNumber(100) } as CosmosDelegationInfo,
      ],
    } as Transaction;
    const { aminoMsgs, protoMsgs } = txToMessages(account, transaction, zenrock);
    expect(aminoMsgs[0].type).toEqual("zrchain/MsgUndelegate");
    expect(aminoMsgs[0].value.msg).toBeUndefined();
    expect(aminoMsgs[0].value.validator_address).toEqual(validatorAddress);
    expect(protoMsgs[0].typeUrl).toEqual("/zrchain.validation.MsgUndelegate");
    const decoded = MsgUndelegate.decode(protoMsgs[0].value);
    expect(decoded.validatorAddress).toEqual(validatorAddress);
    expect(decoded.amount).toEqual({ denom: "uzen", amount: "100" });
  });

  it("redelegate: zrchain labels and a bare (non-wrapped) value", () => {
    const sourceValidator = "zenvaloper1sourcesourcesourcesourcesourcesrc";
    const transaction = {
      mode: "redelegate",
      sourceValidator,
      validators: [
        { address: validatorAddress, amount: new BigNumber(100) } as CosmosDelegationInfo,
      ],
    } as Transaction;
    const { aminoMsgs, protoMsgs } = txToMessages(account, transaction, zenrock);
    expect(aminoMsgs[0].type).toEqual("zrchain/MsgBeginRedelegate");
    expect(aminoMsgs[0].value.msg).toBeUndefined();
    expect(aminoMsgs[0].value.validator_src_address).toEqual(sourceValidator);
    expect(aminoMsgs[0].value.validator_dst_address).toEqual(validatorAddress);
    expect(protoMsgs[0].typeUrl).toEqual("/zrchain.validation.MsgBeginRedelegate");
    const decoded = MsgBeginRedelegate.decode(protoMsgs[0].value);
    expect(decoded.validatorSrcAddress).toEqual(sourceValidator);
    expect(decoded.validatorDstAddress).toEqual(validatorAddress);
    expect(decoded.amount).toEqual({ denom: "uzen", amount: "100" });
  });
});

describe("txToMessages — the cosmos chain uses standard cosmos-sdk staking msgs (no wrapping)", () => {
  const account = {
    freshAddress: "cosmos1delegator",
    currency: { id: "cosmos", units: [{ code: "ATOM" }, { code: "uatom" }] },
  } as CosmosAccount;

  it("delegate: cosmos-sdk labels and a bare (non-wrapped) value", () => {
    const transaction = {
      mode: "delegate",
      amount: new BigNumber(100),
      validators: [
        { address: "cosmosvaloper1x", amount: new BigNumber(100) } as CosmosDelegationInfo,
      ],
    } as Transaction;
    const { aminoMsgs, protoMsgs } = txToMessages(account, transaction, cosmos);
    expect(aminoMsgs[0].type).toEqual("cosmos-sdk/MsgDelegate");
    expect(aminoMsgs[0].value.msg).toBeUndefined();
    expect(protoMsgs[0].typeUrl).toEqual("/cosmos.staking.v1beta1.MsgDelegate");
  });
});

describe("txToMessages — babylon amino sign-doc verifies against a real on-chain signature", () => {
  // Fixture: a real Keplr+Ledger delegation on bbn-1 (tx D3D17ECC4C04DB4EDBA145EF68691DF103B6CB2D24D7F24618887AA528045FEC).
  // It proves the wrapped-msg amino `type` is the proto type URL, not the legacy "epoching/WrappedDelegate" name.
  it("recovers the signer pubkey of a real mainnet WrappedDelegate tx", () => {
    const account = {
      freshAddress: "bbn12v96axyv2cj28hp468haw2rzg8a35lj758yvkx",
      currency: { id: "babylon", units: [{ code: "BABY" }, { code: "ubbn" }] },
    } as CosmosAccount;
    const transaction = {
      mode: "delegate",
      amount: new BigNumber(1000000),
      validators: [
        {
          address: "bbnvaloper1u9w7kfngrsr2defextqf5fscypw8dys50pdza4",
          amount: new BigNumber(1000000),
        } as CosmosDelegationInfo,
      ],
    } as Transaction;
    const { aminoMsgs } = txToMessages(account, transaction, new Babylon());

    // mirror signOperation: wrap the amino msgs in the StdSignDoc the device signs
    const signDoc = makeSignDoc(
      aminoMsgs as AminoMsg[],
      { amount: [{ denom: "ubbn", amount: "2057" }], gas: "293764" },
      "bbn-1",
      "",
      "364419",
      "0",
    );
    const hash = sha256(serializeSignDoc(signDoc));
    const pubkey = Uint8Array.from(
      Buffer.from("An8LLu9QjqdCpcVa3Dw6HGzeR5IcBlIZ4Im/3FcypWW0", "base64"),
    );
    const sig = Uint8Array.from(
      Buffer.from(
        "s30u2an5XITNhKmMxAo5IOjp4U4WwlwBuh4xadzrpcovUqkEV2lYm/eKTmgv6VDpF/2wmt1PsrTNsysD/hlqYw==",
        "base64",
      ),
    );
    const r = sig.slice(0, 32);
    const s = sig.slice(32, 64);
    const recovered = [0, 1, 2, 3].some(rec => {
      try {
        return Buffer.from(
          Secp256k1.compressPubkey(
            Secp256k1.recoverPubkey(new ExtendedSecp256k1Signature(r, s, rec), hash),
          ),
        ).equals(Buffer.from(pubkey));
      } catch {
        return false;
      }
    });
    expect(recovered).toBe(true);
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
