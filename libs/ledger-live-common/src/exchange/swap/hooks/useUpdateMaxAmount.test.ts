import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { act, renderHook } from "@testing-library/react-hooks";
import BigNumber from "bignumber.js";
import { checkAccountSupported } from "../../../account/index";
import ethBridge from "../../../families/ethereum/bridge/mock";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import { useUpdateMaxAmount, ZERO } from "./useUpdateMaxAmount";

// Needs to be mocked since userSupportedCurrencies is initially empty.
jest.mock("../../../account/support");
const mockedCheckAccount = jest.mocked(checkAccountSupported);
// Mock to use a custom estimate value and test the result.
jest.mock("../../../families/ethereum/bridge/mock");
const mockedEstimateMaxSpendable = jest.mocked(
  ethBridge.accountBridge.estimateMaxSpendable,
  true
);

const ETH = getCryptoCurrencyById("ethereum");
const USDT = getTokenById("ethereum/erc20/usd_tether__erc20_");

const parentAccount = genAccount("parent-account", {
  currency: ETH,
});
const account = genTokenAccount(1, parentAccount, USDT);

describe("updateAmountUsingMax", () => {
  const setFromAmount = jest.fn();

  const defaultProps = {
    setFromAmount,
    account,
    parentAccount,
    transaction: { amount: new BigNumber(1) } as any,
    feesStrategy: "slow" as any,
  };

  beforeAll(() => {
    mockedCheckAccount.mockImplementation(() => null);
  });

  afterAll(() => {
    mockedCheckAccount.mockReset();
  });

  beforeEach(() => {
    setFromAmount.mockClear();
  });

  const wait = () => new Promise((resolve) => setTimeout(resolve, 500));

  it("should toggle the amount", async () => {
    const amount = new BigNumber(0.5);
    mockedEstimateMaxSpendable.mockResolvedValue(amount);
    const { result } = renderHook(useUpdateMaxAmount, {
      initialProps: defaultProps,
    });

    expect(result.current.isMaxEnabled).toBe(false);
    expect(setFromAmount).toBeCalledTimes(0);
    act(() => result.current.toggleMax());
    expect(result.current.isMaxEnabled).toBe(true);

    // Lest resort solution, since waitFor and other helpers will not work here.
    await wait();

    expect(setFromAmount).toBeCalledTimes(1);
    expect(setFromAmount.mock.calls[0][0]).toBe(amount);
    setFromAmount.mockClear();

    act(() => result.current.toggleMax());
    expect(result.current.isMaxEnabled).toBe(false);

    await wait();

    expect(setFromAmount).toBeCalledTimes(1);
    expect(setFromAmount.mock.calls[0][0]).toBe(ZERO);
  });

  it("should update the max amount whenever the dependencies change", async () => {
    const { result, rerender } = renderHook(useUpdateMaxAmount, {
      initialProps: defaultProps,
    });

    const feesGenerator = (function* feesGenerator() {
      const feesArray = ["medium", "fast", "custom", "slow"];
      let index = 0;
      while (true) {
        yield feesArray[index];
        index = (index + 1) % feesArray.length;
      }
    })();

    // setFromAmount, account, parentAccount, feesStrategy
    const propsVariants = [
      {
        ...defaultProps,
        account: { ...account },
      },
      {
        ...defaultProps,
        parentAccount: { ...parentAccount },
      },
      {
        ...defaultProps,
        feesStrategy: feesGenerator.next().value,
      },
    ];

    // Updating dependencies when the toggle is off should not do anything.
    propsVariants.forEach(rerender);
    expect(setFromAmount).toBeCalledTimes(0);

    mockedEstimateMaxSpendable.mockResolvedValue(new BigNumber(0));
    act(() => result.current.toggleMax());
    await wait();

    // Checking that updating dependencies update the max amount when the toggle is on.
    let idx = 1;
    for await (const props of propsVariants) {
      const amount = new BigNumber(idx);
      setFromAmount.mockReset();
      mockedEstimateMaxSpendable.mockResolvedValue(amount);
      rerender(props);
      await wait();
      expect(setFromAmount).toBeCalledTimes(1);
      expect(setFromAmount.mock.calls[0][0]).toBe(amount);
      idx += 1;
    }
  });
});
