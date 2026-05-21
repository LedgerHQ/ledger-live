import { Account } from "@ledgerhq/types-live";
import { classifyChecked } from "./stepImportSelection";

const makeBridge = (empty: boolean) => ({ isAccountEmpty: () => empty });

describe("classifyChecked", () => {
  it("returns both flags false when nothing is checked", () => {
    expect(classifyChecked([], [])).toEqual({
      willCreateAccount: false,
      willAddAccounts: false,
    });
  });

  it("flags both when the selection mixes empty and non-empty accounts", () => {
    const accounts = [{ id: "1" }, { id: "2" }] as Account[];
    const bridges = [makeBridge(true), makeBridge(false)];
    expect(classifyChecked(accounts, bridges)).toEqual({
      willCreateAccount: true,
      willAddAccounts: true,
    });
  });

  it("flags only willCreateAccount when every checked account is empty", () => {
    const accounts = [{ id: "1" }, { id: "2" }] as Account[];
    const bridges = [makeBridge(true), makeBridge(true)];
    expect(classifyChecked(accounts, bridges)).toEqual({
      willCreateAccount: true,
      willAddAccounts: false,
    });
  });

  it("flags only willAddAccounts when every checked account is non-empty", () => {
    const accounts = [{ id: "1" }, { id: "2" }] as Account[];
    const bridges = [makeBridge(false), makeBridge(false)];
    expect(classifyChecked(accounts, bridges)).toEqual({
      willCreateAccount: false,
      willAddAccounts: true,
    });
  });
});
