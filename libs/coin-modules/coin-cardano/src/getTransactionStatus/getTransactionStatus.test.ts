import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import * as sanction from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CardanoCoinConfig } from "../config";
import { CardanoInvalidConfigError, CardanoMemoExceededSizeError } from "../errors";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { cardanoCoinConfig, createMockContext } from "../fixtures/config";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import * as logicValidateMemo from "../logic/validateMemo";
import { CardanoAccount, CardanoOutput, Transaction } from "../types";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import * as handler from "./handler";

jest.mock("../logic/validateMemo");
jest.mock("./handler", () => {
  const actual = jest.requireActual("./handler");
  return {
    ...actual,
    getTransactionStatusByTransactionMode: jest.fn(actual.getTransactionStatusByTransactionMode),
  };
});

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;
  const spiedGetTransactionStatusByTransactionMode =
    handler.getTransactionStatusByTransactionMode as jest.Mock;
  const spiedIsAddressSanctioned = jest.spyOn(sanction, "isAddressSanctioned");
  let config: CardanoCoinConfig;
  const getTransactionStatus = buildGetTransactionStatus(createMockContext(() => config));

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedGetTransactionStatusByTransactionMode.mockClear();
    spiedIsAddressSanctioned.mockClear();

    spiedValidateMemo.mockReturnValue(true);
    spiedIsAddressSanctioned.mockResolvedValue(false);
    spiedGetTransactionStatusByTransactionMode.mockResolvedValue({
      errors: {},
      warnings: {},
      amount: BigNumber(0),
      totalSpent: BigNumber(0),
      estimatedFees: BigNumber(0),
    });
    config = { ...cardanoCoinConfig, maxFeesWarning: 0, maxFeesError: 0 };
  });

  it("should return not enough funds error for staking flows when there are no utxos", async () => {
    const initialAccount = {
      pendingOperations: [],
      cardanoResources: {
        utxos: [],
      },
    } as unknown as CardanoAccount;

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

  it("should return NotEnoughBalance for a send when the account only holds rewards", async () => {
    spiedGetTransactionStatusByTransactionMode.mockImplementation(
      jest.requireActual("./handler").getTransactionStatusByTransactionMode,
    );
    config = { ...cardanoCoinConfig, maxFeesWarning: 5e6, maxFeesError: 10e6 };
    const account = getCardanoAccountFixture({
      delegation: { dRepHex: "drepHex", rewards: BigNumber(17.4e6) },
      utxos: [],
    });
    account.balance = BigNumber(17.4e6);
    account.spendableBalance = BigNumber(0);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();

    const status = await getTransactionStatus(account, {
      family: "cardano",
      mode: "send",
      recipient:
        "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
      amount: BigNumber(16e6),
      fees: BigNumber(170_000),
      poolId: undefined,
      protocolParams: getProtocolParamsFixture(),
    });

    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });

  describe("fee thresholds", () => {
    const account = getCardanoAccountFixture({ utxos: [{} as CardanoOutput] });
    const transaction = { mode: "send" } as Transaction;
    const statusWithFees = (fees: number) => ({
      errors: {},
      warnings: {},
      amount: BigNumber(0),
      totalSpent: BigNumber(0),
      estimatedFees: BigNumber(fees),
    });
    const thresholds = { ...cardanoCoinConfig, maxFeesWarning: 5e6, maxFeesError: 10e6 };

    it("warns and fails on the thresholds of the account's currency config", async () => {
      const resolve = jest.fn(() => thresholds);
      const getStatus = buildGetTransactionStatus(createMockContext(resolve));

      spiedGetTransactionStatusByTransactionMode.mockResolvedValueOnce(statusWithFees(6e6));
      const warned = await getStatus(account, transaction);
      expect(warned.warnings.feeTooHigh?.name).toBe("CardanoFeeHigh");
      expect(resolve).toHaveBeenCalledWith(account.currency.id);

      spiedGetTransactionStatusByTransactionMode.mockResolvedValueOnce(statusWithFees(11e6));
      await expect(getStatus(account, transaction)).rejects.toThrow("CardanoFeeTooHigh");
    });

    it("resolves the config once and hands the mode handler a context pinned to it", async () => {
      const resolve = jest
        .fn<CardanoCoinConfig, [string?]>()
        .mockReturnValueOnce(thresholds)
        .mockReturnValue({ ...thresholds, maxFeesWarning: 1, maxFeesError: 1 });
      const getStatus = buildGetTransactionStatus(createMockContext(resolve));
      spiedGetTransactionStatusByTransactionMode.mockResolvedValueOnce(statusWithFees(2));

      const status = await getStatus(account, transaction);

      expect(status.warnings).toEqual({});
      expect(resolve).toHaveBeenCalledTimes(1);
      const [pinned] = spiedGetTransactionStatusByTransactionMode.mock.calls[0];
      await expect(pinned.config("cardano_testnet")).resolves.toBe(thresholds);
    });

    it("rejects a warning threshold above the error threshold before building the status", async () => {
      const getStatus = buildGetTransactionStatus(
        createMockContext(() => ({ ...thresholds, maxFeesWarning: 11e6 })),
      );

      await expect(getStatus(account, transaction)).rejects.toThrow(CardanoInvalidConfigError);
      expect(spiedGetTransactionStatusByTransactionMode).not.toHaveBeenCalled();
    });
  });

  it("should return as sender error only sanctioned utxo addresses", async () => {
    const sanctionedAddresses = [
      "addr1eKHLg16K8UTAak8srh6LiTRufkT2uziFKekkfZBxcRNMED",
      "addr1UvY42XTJHMPHDEDch9UWagjhipLjke37Uqm7qzfcSkdPHT",
    ];

    spiedIsAddressSanctioned.mockClear();
    spiedIsAddressSanctioned.mockImplementation((_, address) => {
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
      {
        notAddress: "no address to check if fails",
      },
    ] as unknown as CardanoOutput[];

    const account = {
      currency: { id: "cardano" },
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
      currency: { id: "cardano" },
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

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockClear();
    spiedValidateMemo.mockReturnValueOnce(true);

    const account = {
      currency: { id: "cardano" } as CardanoAccount["currency"],
      pendingOperations: [] as Operation[],
      cardanoResources: {
        utxos: [{} as CardanoOutput],
      },
    } as CardanoAccount;
    const transaction = { memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockClear();
    spiedValidateMemo.mockReturnValueOnce(false);

    const account = {
      currency: { id: "cardano" } as CardanoAccount["currency"],
      pendingOperations: [] as Operation[],
      cardanoResources: {
        utxos: [{} as CardanoOutput],
      },
    } as CardanoAccount;
    const transaction = { memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(CardanoMemoExceededSizeError);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });
});
