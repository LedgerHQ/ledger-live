import { MsgDelegateEncodeObject } from "@cosmjs/stargate";
import BigNumber from "bignumber.js";
import { buildUnsignedPayloadTransaction } from "./js-buildTransaction";
import { CosmosAccount, CosmosDelegationInfo, Transaction } from "./types";

describe("buildTransactionWithUnsignedPayload", () => {
  const transaction: Transaction = {} as Transaction;
  const account: CosmosAccount = {
    freshAddress: "accAddress",
    currency: { units: [{ code: "atom" }, { code: "uatom" }] },
  } as CosmosAccount;

  describe("When transaction mode is send", () => {
    beforeEach(() => {
      transaction.mode = "send";
    });

    it("should return a MsgSend message if transaction is complete", async () => {
      transaction.recipient = "address";
      transaction.amount = new BigNumber(1000);
      const [message] = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as any[];
      expect(message).toBeTruthy();
      expect(message.typeUrl).toContain("MsgSend");
      expect(message.value.toAddress).toEqual(transaction.recipient);
      expect(message.value.fromAddress).toEqual(account.freshAddress);
      expect(message.value.amount[0].amount).toEqual(
        transaction.amount.toString()
      );
      expect(message.value.amount[0].denom).toEqual(
        account.currency.units[1].code
      );
    });

    it("should return no message if recipient isn't defined", async () => {
      transaction.amount = new BigNumber(10);
      transaction.recipient = "";
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if amount is zero", async () => {
      transaction.amount = new BigNumber(0);
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if amount is negative", async () => {
      transaction.amount = new BigNumber(-10);
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });

  describe("When transaction mode is delegate", () => {
    beforeEach(() => {
      transaction.mode = "delegate";
    });

    it("should return a MsgDelegate message if transaction is complete", async () => {
      transaction.amount = new BigNumber(1000);
      transaction.validators = [
        {
          address: "realAddressTrustMe",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const [message] = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as MsgDelegateEncodeObject[];
      expect(message).toBeTruthy();
      expect(message.typeUrl).toContain("MsgDelegate");
      expect(message.value.validatorAddress).toEqual(
        transaction.validators[0].address
      );
      expect(message.value.delegatorAddress).toEqual(account.freshAddress);
      expect(message.value.amount?.amount).toEqual(
        transaction.amount.toString()
      );
      expect(message.value.amount?.denom).toEqual(
        account.currency.units[1].code
      );
    });

    it("should return no message if tx has a 0 amount", async () => {
      transaction.amount = new BigNumber(0);
      transaction.validators = [
        { address: "realAddressTrustMe" } as CosmosDelegationInfo,
      ];
      const messages = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as MsgDelegateEncodeObject[];
      expect(messages.length).toEqual(0);
    });

    it("should return no message if tx has a negative amount", async () => {
      transaction.amount = new BigNumber(-1);
      transaction.validators = [
        { address: "realAddressTrustMe" } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validators has no address", async () => {
      transaction.validators = [{} as CosmosDelegationInfo];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validators aren't defined", async () => {
      transaction.validators = [];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });

  describe("When transaction mode is undelegate", () => {
    beforeEach(() => {
      transaction.mode = "undelegate";
    });

    it("should return a MsgDelegate message if transaction is complete", async () => {
      transaction.amount = new BigNumber(1000);
      transaction.validators = [
        {
          address: "realAddressTrustMe",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const [message] = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as MsgDelegateEncodeObject[];
      expect(message).toBeTruthy();
      expect(message.typeUrl).toContain("MsgUndelegate");
      expect(message.value.validatorAddress).toEqual(
        transaction.validators[0].address
      );
      expect(message.value.delegatorAddress).toEqual(account.freshAddress);
      expect(message.value.amount?.amount).toEqual(
        transaction.validators[0].amount.toString()
      );
      expect(message.value.amount?.denom).toEqual(
        account.currency.units[1].code
      );
    });

    it("should return no message if validators aren't defined", async () => {
      transaction.validators = [];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator address isn't defined", async () => {
      transaction.validators = [
        {
          address: "",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator amount is 0", async () => {
      transaction.validators = [
        {
          address: "address",
          amount: new BigNumber(0),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator amount is negative", async () => {
      transaction.validators = [
        {
          address: "address",
          amount: new BigNumber(-10),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });

  describe("When transaction mode is redelegate", () => {
    beforeEach(() => {
      transaction.mode = "redelegate";
    });

    it("should return a MsgBeginRedelegate message if transaction is complete", async () => {
      transaction.sourceValidator = "source";
      transaction.validators = [
        {
          address: "realAddressTrustMe",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const [message] = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as any[];
      expect(message).toBeTruthy();
      expect(message.typeUrl).toContain("MsgBeginRedelegate");
      expect(message.value.validatorSrcAddress).toEqual(
        transaction.sourceValidator
      );
      expect(message.value.validatorDstAddress).toEqual(
        transaction.validators[0].address
      );
      expect(message.value.delegatorAddress).toEqual(account.freshAddress);
      expect(message.value.amount.amount).toEqual(
        transaction.validators[0].amount.toString()
      );
      expect(message.value.amount.denom).toEqual(
        account.currency.units[1].code
      );
    });

    it("should return no message if sourceValidator isn't defined", async () => {
      transaction.sourceValidator = "";
      transaction.validators = [
        {
          address: "address",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator address isn't defined", async () => {
      transaction.validators = [
        {
          address: "",
          amount: new BigNumber(100),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator amount is 0", async () => {
      transaction.validators = [
        {
          address: "address",
          amount: new BigNumber(0),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator amount is negative", async () => {
      transaction.validators = [
        {
          address: "address",
          amount: new BigNumber(-10),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });

  describe("When transaction mode is claimReward", () => {
    beforeEach(() => {
      transaction.mode = "claimReward";
    });

    it("should return a MsgWithdrawDelegatorReward message if transaction is complete", async () => {
      transaction.validators = [
        {
          address: "iAmAValidatorAddress",
          amount: new BigNumber(1000),
        } as CosmosDelegationInfo,
      ];
      const [message] = (await buildUnsignedPayloadTransaction(
        account,
        transaction
      )) as any[];
      expect(message).toBeTruthy();
      expect(message.typeUrl).toContain("MsgWithdrawDelegatorReward");
      expect(message.value.validatorAddress).toEqual(
        transaction.validators[0].address
      );
      expect(message.value.delegatorAddress).toEqual(account.freshAddress);
    });

    it("should return no message if validator isn't defined", async () => {
      transaction.validators = [];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });

    it("should return no message if validator address isn't defined", async () => {
      transaction.validators = [
        {
          address: "",
          amount: new BigNumber(1000),
        } as CosmosDelegationInfo,
      ];
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });

  describe("When transaction mode is claimRewardCompound", () => {
    beforeEach(() => {
      transaction.mode = "claimRewardCompound";
    });

    it("should return a MsgWithdrawDelegatorReward message and a MsgDelegate if transaction is complete", async () => {
      transaction.validators = [
        {
          address: "iAmAValidatorAddress",
          amount: new BigNumber(1000),
        } as CosmosDelegationInfo,
      ];
      const [withDrawMessage, delegateMessage] =
        (await buildUnsignedPayloadTransaction(account, transaction)) as any[];
      expect(withDrawMessage).toBeTruthy();
      expect(withDrawMessage.typeUrl).toContain("MsgWithdrawDelegatorReward");
      expect(withDrawMessage.value.validatorAddress).toEqual(
        transaction.validators[0].address
      );
      expect(withDrawMessage.value.delegatorAddress).toEqual(
        account.freshAddress
      );
      expect(delegateMessage).toBeTruthy();
      expect(delegateMessage.typeUrl).toContain("MsgDelegate");
      expect(delegateMessage.value.validatorAddress).toEqual(
        transaction.validators[0].address
      );
      expect(delegateMessage.value.delegatorAddress).toEqual(
        account.freshAddress
      );
      expect(delegateMessage.value.amount.amount).toEqual(
        transaction.validators[0].amount.toString()
      );
      expect(delegateMessage.value.amount.denom).toEqual(
        account.currency.units[1].code
      );
    });
  });

  describe("When transaction mode isn't known", () => {
    it("should return no message", async () => {
      // @ts-expect-error Random mode that isn't listed in typescript type
      transaction.mode = "RandomModeThatICreatedMyself";
      const messages = await buildUnsignedPayloadTransaction(
        account,
        transaction
      );
      expect(messages.length).toEqual(0);
    });
  });
});
