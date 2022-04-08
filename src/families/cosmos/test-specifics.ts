import { BigNumber } from "bignumber.js";
import { cosmosCreateMessage } from "./message";
import { withLibcore } from "../../libcore/access";
import { getCryptoCurrencyById } from "../../currencies";
import { Transaction } from "./types";
export default () => {
  describe("cosmosCreateMessage", () => {
    const commonTransaction = {
      family: "cosmos",
      fees: null,
      gas: null,
      recipient: "",
      useAllAmount: false,
      networkInfo: null,
      memo: null,
      cosmosSourceValidator: null,
      validators: [],
    };
    const sourceAddresss = "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl";
    const currency = getCryptoCurrencyById("cosmos");
    test("create a message send", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(3000),
            mode: "send",
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(1);
    });
    test("create a message delegate that throw and error", async () => {
      await withLibcore(async (core) => {
        try {
          return await cosmosCreateMessage(
            sourceAddresss,
            {
              ...commonTransaction,
              amount: new BigNumber(3000),
              mode: "delegate",
            } as Transaction,
            core,
            currency
          );
        } catch (e: any) {
          expect(e.message).toBe("no validators");
        }
      });
    });
    test("create a message delegate with multiples validators", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(3000),
            mode: "delegate",
            validators: [
              {
                amount: new BigNumber(3000),
                address: "",
              },
              {
                amount: new BigNumber(3000),
                address: "",
              },
              {
                amount: new BigNumber(3000),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages[1].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages[2].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(3);
    });
    test("create a message delegate", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(3000),
            mode: "delegate",
            validators: [
              {
                amount: new BigNumber(3000),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(1);
    });
    test("create a message undelegate", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(3000),
            mode: "undelegate",
            validators: [
              {
                amount: new BigNumber(3000),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(1);
    });
    test("create a message redelegate - without cosmosSourceValidator", async () => {
      await withLibcore(async (core) => {
        try {
          return await cosmosCreateMessage(
            sourceAddresss,
            {
              ...commonTransaction,
              amount: new BigNumber(0),
              mode: "redelegate",
              cosmosSourceValidator: null,
              validators: [
                {
                  amount: new BigNumber(3000),
                  address: "",
                },
              ],
            } as Transaction,
            core,
            currency
          );
        } catch (e: any) {
          expect(e.message).toBe("source validator is empty");
        }
      });
    });
    test("create a message redelegate", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(3000),
            mode: "redelegate",
            cosmosSourceValidator: "source",
            validators: [
              {
                amount: new BigNumber(3000),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(1);
    });
    test("create a message claimReward", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(0),
            mode: "claimReward",
            validators: [
              {
                amount: new BigNumber(0),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(1);
    });
    test("create a message claimRewardCompound", async () => {
      const messages = await withLibcore(async (core) => {
        return await cosmosCreateMessage(
          sourceAddresss,
          {
            ...commonTransaction,
            amount: new BigNumber(0),
            mode: "claimRewardCompound",
            validators: [
              {
                amount: new BigNumber(0),
                address: "",
              },
            ],
          } as Transaction,
          core,
          currency
        );
      });
      expect(messages[0].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages[1].constructor.name).toBe("NJSCosmosLikeMessage");
      expect(messages.length).toBe(2);
    });
  });
};
