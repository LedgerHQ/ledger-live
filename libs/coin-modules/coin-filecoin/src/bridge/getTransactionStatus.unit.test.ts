import BigNumber from "bignumber.js";
import { InvalidRecipientForTokenTransfer } from "../errors";
import { createMockAccount, createMockTokenAccount, createMockTransaction } from "../test/fixtures";
import { getTransactionStatus } from "./getTransactionStatus";

const F1_ADDRESS = "f1plmg3kklvmnodfboimcq5w27mnfs2hwjtas6gia";
const F4_ADDRESS = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ETH_ADDRESS = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const F0_ADDRESS = "f01840380";

const FEES = new BigNumber(10000);

const makeAccount = (spendableBalance = 1_000_000, balance = spendableBalance) =>
  createMockAccount({
    freshAddress: F1_ADDRESS,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendableBalance),
  });

const makeTransaction = (overrides: Parameters<typeof createMockTransaction>[0] = {}) =>
  createMockTransaction({
    gasFeeCap: new BigNumber(1000),
    gasLimit: new BigNumber(10),
    gasPremium: new BigNumber(10000),
    recipient: F1_ADDRESS,
    amount: new BigNumber(1),
    ...overrides,
  });

describe("getTransactionStatus (legacy bridge)", () => {
  describe.each([
    ["f1", F1_ADDRESS],
    ["f0", F0_ADDRESS],
    ["f4", F4_ADDRESS],
    ["0x eth", ETH_ADDRESS],
  ])("with a valid %s recipient", (_name, recipient) => {
    it("returns no errors and the amount plus fees as total spent", async () => {
      const status = await getTransactionStatus(makeAccount(), makeTransaction({ recipient }));

      expect(status.errors).toEqual({});
      expect(status.amount).toEqual(new BigNumber(1));
      expect(status.estimatedFees).toEqual(FEES);
      expect(status.totalSpent).toEqual(new BigNumber(10001));
    });
  });

  it("returns InvalidAddress on the recipient for an invalid fil address", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ recipient: "novalidaddress", amount: new BigNumber(100) }),
    );

    expect(status.errors.recipient?.name).toEqual("InvalidAddress");
    expect(status.errors.sender).toBeUndefined();
  });

  it("returns InvalidAddress on the recipient for an invalid eth address", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ recipient: "0x689c9b3232210tt9b84ef444d0ef35d11102adjj" }),
    );

    expect(status.errors.recipient?.name).toEqual("InvalidAddress");
  });

  it("returns RecipientRequired when the recipient is empty", async () => {
    const status = await getTransactionStatus(makeAccount(), makeTransaction({ recipient: "" }));

    expect(status.errors.recipient?.name).toEqual("RecipientRequired");
  });

  it("returns InvalidAddress on the sender when the sender address is invalid", async () => {
    const status = await getTransactionStatus(
      createMockAccount({ freshAddress: "novalidaddress" }),
      makeTransaction(),
    );

    expect(status.errors.sender?.name).toEqual("InvalidAddress");
    expect(status.errors.recipient).toBeUndefined();
  });

  it("returns FeeNotLoaded when gasLimit is zero", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ gasLimit: new BigNumber(0) }),
    );

    expect(status.errors.gas?.name).toEqual("FeeNotLoaded");
  });

  it.each([["gasFeeCap"], ["gasPremium"]])("returns FeeNotLoaded when %s is zero", async field => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ [field]: new BigNumber(0) }),
    );

    expect(status.errors.gas?.name).toEqual("FeeNotLoaded");
  });

  it("returns AmountRequired when the amount is zero", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ amount: new BigNumber(0) }),
    );

    expect(status.errors.amount?.name).toEqual("AmountRequired");
  });

  it("returns NotEnoughBalance when the amount plus fees exceeds the spendable balance", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ amount: new BigNumber(1_000_000) }),
    );

    expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
  });

  it("computes the amount as the spendable balance minus fees on send max", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ useAllAmount: true }),
    );

    expect(status.errors).toEqual({});
    expect(status.amount).toEqual(new BigNumber(990000));
    expect(status.totalSpent).toEqual(new BigNumber(1_000_000));
  });

  it("returns NotEnoughBalance on send max when fees exceed the spendable balance", async () => {
    const status = await getTransactionStatus(
      makeAccount(5000),
      makeTransaction({ useAllAmount: true }),
    );

    expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
  });

  it("returns AmountRequired rather than NotEnoughBalance on send max when fees equal the spendable balance", async () => {
    const status = await getTransactionStatus(
      makeAccount(10000),
      makeTransaction({ useAllAmount: true }),
    );

    expect(status.errors.amount?.name).toEqual("AmountRequired");
  });

  it("returns NotEnoughBalance on send max when the total spent exceeds the balance", async () => {
    const status = await getTransactionStatus(
      makeAccount(1_000_000, 500_000),
      makeTransaction({ useAllAmount: true }),
    );

    expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
  });

  it("returns empty warnings", async () => {
    const status = await getTransactionStatus(makeAccount(), makeTransaction());

    expect(status.warnings).toEqual({});
  });

  describe("with a token sub account", () => {
    const parent = makeAccount();
    const baseTokenAccount = createMockTokenAccount(parent);
    const tokenAccount = {
      ...baseTokenAccount,
      id: "token-sub-account",
      spendableBalance: new BigNumber(1000),
      token: { ...baseTokenAccount.token, contractAddress: F4_ADDRESS },
    };
    const makeAccountWithToken = (spendableBalance = 1_000_000) =>
      createMockAccount({
        freshAddress: F1_ADDRESS,
        balance: new BigNumber(spendableBalance),
        spendableBalance: new BigNumber(spendableBalance),
        subAccounts: [tokenAccount],
      });
    const makeTokenTransaction = (overrides: Parameters<typeof createMockTransaction>[0] = {}) =>
      makeTransaction({ subAccountId: tokenAccount.id, amount: new BigNumber(10), ...overrides });

    it("returns no errors for an erc20 transfer to an f0 recipient", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(),
        makeTokenTransaction({ recipient: F0_ADDRESS }),
      );

      expect(status.errors).toEqual({});
      expect(status.amount).toEqual(new BigNumber(10));
      expect(status.totalSpent).toEqual(new BigNumber(10));
    });

    it("returns InvalidRecipientForTokenTransfer for an f1 recipient", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(),
        makeTokenTransaction({ recipient: F1_ADDRESS }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidRecipientForTokenTransfer);
    });

    it("returns NotEnoughBalance when the token amount exceeds the token spendable balance", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(),
        makeTokenTransaction({ recipient: ETH_ADDRESS, amount: new BigNumber(2000) }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("returns NotEnoughBalance when the parent spendable balance cannot cover the fees", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(5000),
        makeTokenTransaction({ recipient: F0_ADDRESS }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("sets the amount to the token spendable balance on send max", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(),
        makeTokenTransaction({
          recipient: F4_ADDRESS,
          amount: new BigNumber(1),
          useAllAmount: true,
        }),
      );

      expect(status.errors).toEqual({});
      expect(status.amount).toEqual(new BigNumber(1000));
      expect(status.totalSpent).toEqual(new BigNumber(1000));
    });

    it("does not return AmountRequired for a zero token amount", async () => {
      const status = await getTransactionStatus(
        makeAccountWithToken(),
        makeTokenTransaction({ recipient: F0_ADDRESS, amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeUndefined();
    });
  });
});
