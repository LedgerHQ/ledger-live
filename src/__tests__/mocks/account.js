import { genAccount } from "../../mock/account";

test("generate an account from seed", () => {
  const a = genAccount("seed");
  const b = genAccount("seed");
  expect(a).toEqual(b);
});

test("dont generate negative balance", () => {
  const a = genAccount("n");
  expect(a.balance).toBeGreaterThan(0);
});
