import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount } from "../../api/network";
import { setCoinConfig } from "../../config";
import getTransactionStatus from "../../getTransactionStatus";
import {
  account,
  API_KADENA_ENDPOINT,
  transaction as baseTransaction,
  mockAddress,
} from "../fixtures/common.fixtures";

jest.mock("../../api/network");

describe("getTransactionStatus", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_KADENA_ENDPOINT,
      },
    }));
    const fetchCoinDetailsForAccountMock = jest.mocked(fetchCoinDetailsForAccount);
    fetchCoinDetailsForAccountMock.mockReturnValue(Promise.resolve({ "0": "0.000916781498" }));
  });

  describe("Recipient", () => {
    it("should detect the missing recipient and have an error", async () => {
      const transaction = { ...baseTransaction, recipient: "" };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new RecipientRequired(),
        }),
      );
    });

    it("should detect the incorrect recipient and have an error", async () => {
      const transaction = { ...baseTransaction, recipient: "isInvalid" };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddress("", {
            currencyName: account.currency.name,
          }),
        }),
      );
    });

    it("should detect the recipient and the sender are the same and have an error", async () => {
      const transaction = {
        ...baseTransaction,
        recipient: mockAddress,
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddressBecauseDestinationIsAlsoSource("", {
            currencyName: account.currency.name,
          }),
        }),
      );
    });
  });

  describe("Amount", () => {
    it("should detect the amount is missing and have an error", async () => {
      const transaction = { ...baseTransaction, amount: new BigNumber(0) };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("should detect the amount is greater than the spendable amount and have an error", async () => {
      const transaction = {
        ...baseTransaction,
        amount: BigNumber(1000000002),
        fees: new BigNumber("20"),
      };
      const res = await getTransactionStatus(account, transaction);
      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });
  });
});
