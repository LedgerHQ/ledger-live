import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import { GAS } from "./constants";
import { getFees } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import {
  buildAccount,
  buildDelegation,
  buildTokenAccount,
  buildTransaction,
  DELEGATION_CONTRACT,
  MEX_TOKEN,
} from "./test/fixtures";

jest.mock("./network", () => ({ getFees: jest.fn() }));

const mockGetFees = getFees as jest.Mock;
const FEES = new BigNumber(61000);
const base64 = (value: string) => Buffer.from(value).toString("base64");

describe("prepareTransaction", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async id => (id === MEX_TOKEN.id ? MEX_TOKEN : undefined),
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(() => {
    mockGetFees.mockReset();
    mockGetFees.mockResolvedValue(FEES);
  });

  it("loads the fees of a send without touching its data", async () => {
    const prepared = await prepareTransaction(buildAccount(), buildTransaction());

    expect({ fees: prepared.fees?.toString(), data: prepared.data }).toEqual({
      fees: "61000",
      data: undefined,
    });
  });

  it("encodes an ESDT transfer with the token identifier and the hex amount", async () => {
    const account = buildAccount({ withToken: true });

    const prepared = await prepareTransaction(
      account,
      buildTransaction({ subAccountId: buildTokenAccount().id, amount: new BigNumber(10) }),
    );

    expect({ data: prepared.data, gasLimit: prepared.gasLimit }).toEqual({
      data: base64("ESDTTransfer@4d45582d343535633537@0a"),
      gasLimit: GAS.ESDT_TRANSFER,
    });
  });

  it("sets the token balance as amount for an ESDT send max and keeps it untouched by the fees", async () => {
    const account = buildAccount({ withToken: true });

    const prepared = await prepareTransaction(
      account,
      buildTransaction({
        subAccountId: buildTokenAccount().id,
        amount: new BigNumber(0),
        useAllAmount: true,
      }),
    );

    expect({ amount: prepared.amount.toString(), fees: prepared.fees?.toString() }).toEqual({
      amount: "100",
      fees: "61000",
    });
  });

  it("sets the spendable balance minus the fees as amount for an EGLD send max", async () => {
    const account = buildAccount({ balance: "1000000" });

    const prepared = await prepareTransaction(
      account,
      buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
    );

    expect({ amount: prepared.amount.toString(), fees: prepared.fees?.toString() }).toEqual({
      amount: "939000",
      fees: "61000",
    });
  });

  it("sets a zero amount for an EGLD send max when the fees exceed the balance", async () => {
    const account = buildAccount({ balance: "100" });

    const prepared = await prepareTransaction(
      account,
      buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
    );

    expect(prepared.amount.toString()).toBe("0");
  });

  it.each([
    ["delegate", GAS.DELEGATE, "delegate"],
    ["claimRewards", GAS.CLAIM, "claimRewards"],
    ["withdraw", GAS.DELEGATE, "withdraw"],
    ["reDelegateRewards", GAS.DELEGATE, "reDelegateRewards"],
  ] as const)("encodes the %s staking mode", async (mode, gasLimit, data) => {
    const prepared = await prepareTransaction(
      buildAccount(),
      buildTransaction({ mode, recipient: DELEGATION_CONTRACT }),
    );

    expect({ data: prepared.data, gasLimit: prepared.gasLimit }).toEqual({
      data: base64(data),
      gasLimit,
    });
  });

  it("encodes the unDelegate amount in even-length hex", async () => {
    const prepared = await prepareTransaction(
      buildAccount({ delegations: [buildDelegation("5")] }),
      buildTransaction({
        mode: "unDelegate",
        recipient: DELEGATION_CONTRACT,
        amount: new BigNumber(5),
      }),
    );

    expect({ data: prepared.data, gasLimit: prepared.gasLimit }).toEqual({
      data: base64("unDelegate@05"),
      gasLimit: GAS.DELEGATE,
    });
  });

  it("returns the same result when prepared twice or in parallel", async () => {
    const account = buildAccount();
    const transaction = buildTransaction();

    const first = await prepareTransaction(account, { ...transaction });
    const second = await prepareTransaction(account, { ...transaction });
    const [parallelA, parallelB] = await Promise.all([
      prepareTransaction(account, { ...transaction }),
      prepareTransaction(account, { ...transaction }),
    ]);

    expect([second, parallelA, parallelB]).toEqual([first, first, first]);
  });

  it("rejects an unsupported mode", async () => {
    await expect(
      prepareTransaction(
        buildAccount(),
        buildTransaction({ mode: "unknown" as unknown as "send" }),
      ),
    ).rejects.toThrow("Unsupported transaction mode: unknown");
  });
});
