import "./test-helpers/staticTime";
import { genAccount } from "../mock/account";
import { patchAccount } from "../reconciliation";
import { toAccountRaw } from "../account";
const accounts = Array(50)
  .fill(null)
  .map((_, j) => genAccount("seed_" + j));
test("identity keep reference", () => {
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const raw = toAccountRaw(account);
    expect(patchAccount(account, raw)).toBe(account);
  }
});
test("a new operation gets added", () => {
  for (let i = 0; i < accounts.length; i++) {
    const expected = accounts[i];
    const raw = toAccountRaw(expected);
    const account = { ...expected, operations: expected.operations.slice(1) };
    const next = patchAccount(account, raw);
    expect(next).toMatchObject(expected);

    for (let i = 1; i < next.operations.length; i++) {
      expect(next.operations[i]).toBe(expected.operations[i]);
    }
  }
});
test("missing operations gets added", () => {
  for (let i = 0; i < accounts.length; i++) {
    const expected = accounts[i];
    const raw = toAccountRaw(expected);
    const account = { ...expected, operations: [], pendingOperations: [] };
    const next = patchAccount(account, raw);
    expect(next).toMatchObject(expected);
  }
});
