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
    expect(account.init).toBeDefined();
    expect(account.toAptosAccount).toBeDefined();
    expect(account.hdWalletPath).toBeDefined();
    expect(account.address).toBeDefined();
    expect(account.authKey).toBeDefined();
    expect(account.pubKey).toBeDefined();
    expect(account.asyncSignBuffer).toBeDefined();
    expect(account.asyncSignHexString).toBeDefined();
    expect(account.signTransaction).toBeDefined();

    expect(mockedLedgerAccount).toHaveBeenCalledTimes(1);
  });
});
