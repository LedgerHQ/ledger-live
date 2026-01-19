/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import BigNumber from "bignumber.js";
import { CardanoAccount, CardanoOutput, Transaction } from "../types";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import { CardanoCoinConfig } from "../config";

// Mock modules before importing
jest.mock("@ledgerhq/coin-framework/sanction/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/sanction/index"),
  isAddressSanctioned: jest.fn(),
}));

jest.mock("./handler", () => ({
  ...jest.requireActual("./handler"),
  getTransactionStatusByTransactionMode: jest.fn(),
}));

const mockGetCoinConfigFn = jest.fn();
jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: () => mockGetCoinConfigFn(),
  },
}));

import * as sanction from "@ledgerhq/coin-framework/sanction/index";
import * as mode from "./handler";
import { getTransactionStatus } from "./getTransactionStatus";

const mockIsAddressSanctioned = sanction.isAddressSanctioned as jest.Mock;
const mockGetTransactionStatusByTransactionMode =
  mode.getTransactionStatusByTransactionMode as jest.Mock;

describe("getTransactionStatus", () => {
  it("should return not enough funds error when there are no utxos", async () => {
    const initialAccount = {
      pendingOperations: [],
      cardanoResources: {
        utxos: [],
      },
    } as unknown as CardanoAccount;

    const sendTx: Transaction = {
      amount: new BigNumber(1000000),
      recipient:
        "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9",
      mode: "send",
      family: "cardano",
      poolId: undefined,
    };
    const sendTxRes = await getTransactionStatus(initialAccount, sendTx);
    expect(sendTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");

    const delegateTx: Transaction = {
      amount: new BigNumber(0),
      recipient: "",
      mode: "delegate",
      family: "cardano",
      poolId: "d0f48f07e4e5eb8040a988085f7ea3bd32d71a2e2998d53e9bbc959a",
    };
    const delegateTxRes = await getTransactionStatus(initialAccount, delegateTx);
    expect(delegateTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");

    const undelegateTx: Transaction = {
      amount: new BigNumber(0),
      recipient: "",
      mode: "undelegate",
      family: "cardano",
      poolId: undefined,
    };
    const undelegateTxRes = await getTransactionStatus(initialAccount, undelegateTx);
    expect(undelegateTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");
  });

  it("should return as sender error only sanctioned utxo addresses", async () => {
    const sanctionedAddresses = [
      "addr1eKHLg16K8UTAak8srh6LiTRufkT2uziFKekkfZBxcRNMED",
      "addr1UvY42XTJHMPHDEDch9UWagjhipLjke37Uqm7qzfcSkdPHT",
    ];

    mockIsAddressSanctioned.mockImplementation((_, address) => {
      return Promise.resolve(sanctionedAddresses.includes(address));
    });

    const utxos = [
      {
        address: "addr1eKHLg16K8UTAak8srh6LiTRufkT2uziFKekkfZBxcRNMED",
      },
      {
        address: "addr1UvY42XTJHMPHDEDch9UWagjhipLjke37Uqm7qzfcSkdPHT",
      },
      {
        address: "addr1QDz6DDTAk5CNig91MNxgTKXUpYoAbz6WnyZ7AztJUXsDDK",
      },
      {
        address: "addr1Fwc4rtTcbrhmcq3iqDJZULdyxU8nJmam3Jx6oknhY5Jqm2",
      },
    ] as unknown as CardanoOutput[];

    const account = {
      pendingOperations: [],
      cardanoResources: {
        utxos: utxos,
      },
    } as unknown as CardanoAccount;

    const transaction = {} as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({
      sender: new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: sanctionedAddresses,
      }),
    });
  });

  it("should return as no sender error when no utxo address is sanctioned", async () => {
    const maxFeesWarning = BigNumber(1000000);
    mockGetCoinConfigFn.mockReturnValue({
      maxFeesWarning: maxFeesWarning,
      maxFeesError: maxFeesWarning.multipliedBy(2),
    } as unknown as CardanoCoinConfig);

    mockGetTransactionStatusByTransactionMode.mockResolvedValue({
      errors: {},
      warnings: {},
      amount: BigNumber(0),
      totalSpent: BigNumber(0),
      estimatedFees: maxFeesWarning,
    });

    mockIsAddressSanctioned.mockResolvedValue(false);

    const utxos = [
      {
        address: "addr1eKHLg16K8UTAak8srh6LiTRufkT2uziFKekkfZBxcRNMED",
      },
      {
        address: "addr1UvY42XTJHMPHDEDch9UWagjhipLjke37Uqm7qzfcSkdPHT",
      },
      {
        address: "addr1QDz6DDTAk5CNig91MNxgTKXUpYoAbz6WnyZ7AztJUXsDDK",
      },
      {
        address: "addr1Fwc4rtTcbrhmcq3iqDJZULdyxU8nJmam3Jx6oknhY5Jqm2",
      },
    ] as unknown as CardanoOutput[];

    const account = {
      pendingOperations: [],
      cardanoResources: {
        utxos: utxos,
      },
    } as unknown as CardanoAccount;

    const transaction = {
      mode: "send",
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({});
  });
});
