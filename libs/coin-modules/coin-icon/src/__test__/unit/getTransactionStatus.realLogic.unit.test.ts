import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { getTransactionStatus } from "../../getTransactionStatus";
import { IconAccount, Transaction } from "../../types";

const ADDRESS = "hxe52720d9125586e64c745bf3c2c1917dbb46f9ba";

const account = {
  freshAddress: ADDRESS,
  spendableBalance: new BigNumber("299569965"),
  balance: new BigNumber("299569965"),
  currency: { id: "icon", name: "Icon", units: [{ code: "ICX", name: "ICX", magnitude: 18 }] },
  iconResources: { nonce: 0, totalDelegated: new BigNumber(0), votingPower: new BigNumber(0) },
  pendingOperations: [],
} as unknown as IconAccount;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "icon",
    mode: "send",
    recipient: "hxedaf3b2027fbbc0a31f589299c0b34533cd8edac",
    amount: new BigNumber("100000000"),
    fees: null,
    useAllAmount: false,
    ...overrides,
  }) as Transaction;

describe("getTransactionStatus with real logic", () => {
  it("returns InvalidAddressBecauseDestinationIsAlsoSource when the recipient equals the account address", async () => {
    const status = await getTransactionStatus(
      account,
      makeTransaction({ recipient: ADDRESS, fees: new BigNumber(0.00125) }),
    );

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    expect(status.amount).toEqual(new BigNumber("100000000"));
  });

  it("returns InvalidAddress when the recipient is not a valid icon address", async () => {
    const status = await getTransactionStatus(account, makeTransaction({ recipient: "iconinv" }));

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("returns NotEnoughBalance when the spendable balance is below the existential deposit margin", async () => {
    const status = await getTransactionStatus(
      account,
      makeTransaction({ amount: new BigNumber("299569965"), fees: new BigNumber(0) }),
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("returns NotEnoughBalance when the amount exceeds a spendable balance above the margin", async () => {
    const richAccount = {
      ...account,
      spendableBalance: new BigNumber("10000000000000000"),
      balance: new BigNumber("10000000000000000"),
    } as IconAccount;

    const status = await getTransactionStatus(
      richAccount,
      makeTransaction({ amount: new BigNumber("1000000000000000000000000") }),
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });
});
