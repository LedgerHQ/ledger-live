import LedgerAccount from "./LedgerAccount";

jest.mock("./LedgerAccount");
const mockedLedgerAccount = jest.mocked(LedgerAccount);

describe("LedgerAccount Test", () => {
  let account: LedgerAccount;

  beforeAll(() => {
    account = new LedgerAccount("", "");
  });

  it("builds the client properly", () => {
    expect(LedgerAccount.fromLedgerConnection).toBeDefined();
    expect(typeof LedgerAccount.fromLedgerConnection).toBe("function");
    expect(account.init).toBeDefined();
    expect(typeof account.init).toBe("function");
    expect(account.toAptosAccount).toBeDefined();
    expect(typeof account.toAptosAccount).toBe("function");
    expect(account.hdWalletPath).toBeDefined();
    expect(typeof account.hdWalletPath).toBe("function");
    expect(account.address).toBeDefined();
    expect(typeof account.address).toBe("function");
    expect(account.authKey).toBeDefined();
    expect(typeof account.authKey).toBe("function");
    expect(account.pubKey).toBeDefined();
    expect(typeof account.pubKey).toBe("function");
    expect(account.asyncSignBuffer).toBeDefined();
    expect(typeof account.asyncSignBuffer).toBe("function");
    expect(account.asyncSignHexString).toBeDefined();
    expect(typeof account.asyncSignHexString).toBe("function");
    expect(account.signTransaction).toBeDefined();
    expect(typeof account.signTransaction).toBe("function");

    expect(mockedLedgerAccount).toHaveBeenCalledTimes(1);
  });
});
