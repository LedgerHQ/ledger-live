import { genAccount } from "../../mock/account";

test("generate an account from seed", () => {
  const a = genAccount("seed");
  const b = genAccount("seed");
  expect(a).toEqual(b);
});

test("dont generate negative balance", () => {
  const a = genAccount("n"); // <= with just prando, this seed generates negative balance
  expect(a.balance).toBeGreaterThan(0);
});

test("allow specifying number of operations", () => {
  const a = genAccount("n", { operationsSize: 10 });
  expect(a.operations.length).toBe(10);
});
