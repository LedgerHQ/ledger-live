import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { BigNumber } from "bignumber.js";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { buildTransaction } from "../buildTransaction";
import { CardanoMinAmountError } from "../errors";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import type { Transaction } from "../types";
import { getSendTransactionStatus } from "./send";

jest.mock("../buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));
jest.mock("../estimateMaxSpendable", () => ({
  estimateMaxSpendable: jest.fn(),
}));

const mockedBuildTransaction = jest.mocked(buildTransaction);
const mockedEstimateMaxSpendable = jest.mocked(estimateMaxSpendable);

const FEES = new BigNumber(170_000);

const buildTransactionInput = (): Transaction => ({
  family: "cardano",
  recipient:
    "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
  amount: new BigNumber(2e6),
  fees: FEES,
  mode: "send",
  poolId: undefined,
  protocolParams: getProtocolParamsFixture(),
});

describe("getSendTransactionStatus", () => {
  let account: ReturnType<typeof getCardanoAccountFixture>;

  beforeEach(() => {
    mockedBuildTransaction.mockReset();
    mockedEstimateMaxSpendable.mockReset();
    account = getCardanoAccountFixture({});
    account.balance = new BigNumber(100e6);
    account.spendableBalance = new BigNumber(100e6);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
  });

  it.each([
    ["Not enough ADA"],
    ["Not enough tokens"],
    ["Tx size limit reached, try spending lesser ADA/Tokens"],
  ])("maps the build error %p to an amount error instead of re-throwing", async message => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error(message));

    const status = await getSendTransactionStatus(account, buildTransactionInput());

    expect(status.errors.amount?.name).toBe("CardanoNotEnoughFunds");
  });

  it("maps a thrown CardanoMinAmountError to an amount error instead of re-throwing", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new CardanoMinAmountError("", { amount: "1" }));

    const status = await getSendTransactionStatus(account, buildTransactionInput());

    expect(status.errors.amount?.name).toBe("CardanoNotEnoughFunds");
  });

  it.each([
    { scenario: "UTXOs plus rewards", balance: 110e6, spendableBalance: 100e6, amount: 105e6 },
    { scenario: "rewards only", balance: 17.4e6, spendableBalance: 0, amount: 16e6 },
  ])(
    "rejects an amount above the spendable balance with NotEnoughBalance before building ($scenario)",
    async ({ balance, spendableBalance, amount }) => {
      mockedBuildTransaction.mockResolvedValueOnce({} as never);
      account.balance = new BigNumber(balance);
      account.spendableBalance = new BigNumber(spendableBalance);

      const status = await getSendTransactionStatus(account, {
        ...buildTransactionInput(),
        amount: new BigNumber(amount),
      });

      expect(status.errors.amount?.name).toBe("NotEnoughBalance");
    },
  );

  it("accepts an amount that uses the whole spendable balance", async () => {
    mockedBuildTransaction.mockResolvedValueOnce({} as never);
    account.balance = new BigNumber(110e6);
    account.spendableBalance = new BigNumber(100e6);

    const status = await getSendTransactionStatus(account, {
      ...buildTransactionInput(),
      amount: new BigNumber(100e6).minus(FEES),
    });

    expect(status.errors.amount).toBeUndefined();
  });

  it("leaves a Send Max to the builder when the real fee exceeds the estimated one", async () => {
    mockedBuildTransaction.mockResolvedValueOnce({} as never);
    mockedEstimateMaxSpendable.mockResolvedValueOnce(new BigNumber(100e6 - 168_000));

    const status = await getSendTransactionStatus(account, {
      ...buildTransactionInput(),
      useAllAmount: true,
    });

    expect(status.errors.amount).toBeUndefined();
  });

  it("re-throws unexpected build errors", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error("Unexpected programming error"));

    await expect(getSendTransactionStatus(account, buildTransactionInput())).rejects.toThrow(
      "Unexpected programming error",
    );
  });

  it("warns (without blocking) when the recipient is one of the account's own addresses", async () => {
    mockedBuildTransaction.mockResolvedValueOnce({} as never);
    // The fixture's only UTXO is paid to the account's own external credential; its bech32 form is
    // therefore one of the account's own addresses (a self-send). This is the warning the new send
    // flow surfaces as the recipient warning banner.
    const ownAddress = TyphonUtils.getAddressFromHex(
      Buffer.from(account.cardanoResources.utxos[0].address, "hex"),
    ).getBech32();

    const status = await getSendTransactionStatus(account, {
      ...buildTransactionInput(),
      recipient: ownAddress,
    });

    expect(status.errors.recipient).toBeUndefined();
    expect(status.warnings.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });
});
