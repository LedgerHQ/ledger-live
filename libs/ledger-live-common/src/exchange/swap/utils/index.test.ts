import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "../../../currencies";
import { genAccount } from "../../../mock/account";
import {
  getAvailableAccountsById,
  getNoticeType,
  getProviderName,
  isRegistrationRequired,
} from "./index";

/* TODO: Refacto these two function and move them to mock/account.ts if needed */
function* accountGenerator(currency: CryptoCurrency): Generator<Account> {
  let id = 0;
  while (true) {
    id += 1;
    yield genAccount(`mocked-account-${id}`, { currency, operationsSize: 0 });
  }
}
const getAccountCreator = (currencyId: string) => {
  const generator = accountGenerator(getCryptoCurrencyById(currencyId));
  return () => generator.next().value;
};

describe("swap/utils/getAvailableAccountsById", () => {
  const getEthAccount = getAccountCreator("ethereum");
  const getBtcAccount = getAccountCreator("bitcoin");
  const getPolkadotAccount = getAccountCreator("polkadot");
  const getCosmosAccount = getAccountCreator("cosmos");

  test("return the correct accounts after sorting/filtering them", () => {
    const [disabledAccount, higherBalanceAccount, lowerBalanceAccount, ...accounts] = new Array(6)
      .fill(null)
      .map(getEthAccount);

    // mutate some accounts to test sorting/filtering
    disabledAccount.disabled = true;
    higherBalanceAccount.balance = new BigNumber(10);
    lowerBalanceAccount.balance = new BigNumber(2);

    const allAccounts: Account[] = [
      getCosmosAccount(),
      disabledAccount,
      higherBalanceAccount,
      lowerBalanceAccount,
      ...accounts,
      getBtcAccount(),
      getPolkadotAccount(),
    ];

    const results = getAvailableAccountsById("ethereum", allAccounts);
    expect(results).toHaveLength(5);
    expect(results[0].balance.toNumber()).toBeGreaterThan(0);
    expect(results[1].balance.toNumber()).toBeGreaterThan(0);
    expect(results[0].balance.toNumber()).toBeGreaterThan(results[1].balance.toNumber());
  });
});

describe("swap/utils/isRegistrationRequired", () => {
  test("should return registration is not required for changelly", async () => {
    const expectedResult = false;

    const result = await isRegistrationRequired("changelly");

    expect(result).toBe(expectedResult);
  });
});

describe("swap/utils/getProviderName", () => {
  test("should return capitalized provider name for 1inch", () => {
    const expectedResult = "1inch";

    const result = getProviderName("oneinch");

    expect(result).toBe(expectedResult);
  });

  test("should return CIC provider name for cic", () => {
    const expectedResult = "CIC";

    const result = getProviderName("cic");

    expect(result).toBe(expectedResult);
  });

  test("should return MoonPay provider name for moonpay", () => {
    const expectedResult = "MoonPay";

    const result = getProviderName("moonpay");

    expect(result).toBe(expectedResult);
  });

  test("should return capitalized provider name for other provider", () => {
    const expectedResult = "Changelly";

    const result = getProviderName("changelly");

    expect(result).toBe(expectedResult);
  });
});

describe("swap/utils/getNoticeType", function () {
  test("should return notice type for CIC", () => {
    const expectedResult = { message: "provider", learnMore: false };

    const result = getNoticeType("cic");

    expect(result).toEqual(expectedResult);
  });

  test("should return notice type for Changelly", () => {
    const expectedResult = { message: "provider", learnMore: false };

    const result = getNoticeType("changelly");

    expect(result).toEqual(expectedResult);
  });
});
