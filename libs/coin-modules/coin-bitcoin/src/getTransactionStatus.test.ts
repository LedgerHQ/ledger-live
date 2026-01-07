/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import { Account } from "@ledgerhq/types-live";
import * as cache from "./cache";
import { BitcoinInput, Transaction } from "./types";
import getTransactionStatus, { MAX_BLOCK_HEIGHT_FOR_TAPROOT } from "./getTransactionStatus";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import BigNumber from "bignumber.js";
import * as sanction from "@ledgerhq/coin-framework/sanction/index";

const calculateFeesSpy = jest.spyOn(cache, "calculateFees");
const validateRecipientSpy = jest.spyOn(cache, "validateRecipient");
const isAddressSanctionedSpy = jest.spyOn(sanction, "isAddressSanctioned");

describe("getTransactionStatus on Bitcoin", () => {
  it("should return as sender error only sanctioned utxo addresses", async () => {
    validateRecipientSpy.mockResolvedValue({
      recipientError: undefined,
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });

    const sanctionedAddresses = [
      "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
    ];

    const utxoAddresses = [
      {
        address: "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      },
      {
        address: "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
      },
      {
        address: "bc1q2nj06sukhuuuvc88g0rh7eqe3r9n3rm66a7syv",
      },
      {
        address: "bc1qa8kyt89kfh2cnf0q39pglhegj53xcwqtkf6jkd",
      },
    ] as unknown as BitcoinInput[];

    isAddressSanctionedSpy.mockImplementation((_, address: string) => {
      return Promise.resolve(sanctionedAddresses.includes(address));
    });

    calculateFeesSpy.mockResolvedValue({
      txInputs: utxoAddresses,
      txOutputs: [],
      fees: BigNumber(0),
    });

    const account = {
      currency: {
        id: "bitcoin",
      },
      blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
    } as unknown as Account;

    const transaction = {
      amount: BigNumber(1),
      recipient: "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7",
      feePerByte: BigNumber(1),
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({
      sender: new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: sanctionedAddresses,
      }),
    });
  });

  it("should return no sender error when no utxo address is sanctioned", async () => {
    validateRecipientSpy.mockResolvedValue({
      recipientError: undefined,
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });

    const utxoAddresses = [
      {
        address: "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      },
      {
        address: "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
      },
      {
        address: "bc1q2nj06sukhuuuvc88g0rh7eqe3r9n3rm66a7syv",
      },
      {
        address: "bc1qa8kyt89kfh2cnf0q39pglhegj53xcwqtkf6jkd",
      },
    ] as unknown as BitcoinInput[];

    isAddressSanctionedSpy.mockResolvedValue(false);
    calculateFeesSpy.mockResolvedValue({
      txInputs: utxoAddresses,
      txOutputs: [],
      fees: BigNumber(0),
    });

    const account = {
      currency: {
        id: "bitcoin",
      },
      blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
    } as unknown as Account;

    const transaction = {
      amount: BigNumber(1),
      recipient: "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7",
      feePerByte: BigNumber(1),
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({});
  });
});
