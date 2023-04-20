import "../test-helpers/staticTime";
import { genAccount } from "../../mock/account";
import { getBalanceHistory } from "../../portfolio/v2";
import { getEnv, setEnv } from "../../env";
import { setSupportedCurrencies } from "../../currencies";
setSupportedCurrencies(["ethereum", "ethereum_classic", "ripple"]);

test("generate an account from seed", () => {
  const a = genAccount("seed");
  const b = genAccount("seed");
  expect(a).toEqual(b);
});

test("generate an account from different seed should generate a different account", () => {
  const a = genAccount(getEnv("MOCK"));
  setEnv("MOCK", "çacestvraiça");
  const b = genAccount(getEnv("MOCK"));
  expect(a).not.toEqual(b);
});

test("dont generate negative balance", () => {
  const a = genAccount("n"); // <= with just prando, this seed generates negative balance

  expect(a.balance.isNegative()).toBe(false);
});

test("allow specifying number of operations", () => {
  const a = genAccount("n", {
    operationsSize: 10,
  });
  expect(a.operations.length).toBe(10);
});

// NB we can't guarantee that. bug in implementation because JS Numbers
test("mock generators don't generate negative balances", () => {
  for (let i = 0; i < 100; i++) {
    const account = genAccount("negative?" + i);
    const history = getBalanceHistory(account, "year", 300);
    const invalidDataPoints = history.filter((h) => h.value < 0);
    expect(invalidDataPoints).toMatchObject([]);
  }
});
