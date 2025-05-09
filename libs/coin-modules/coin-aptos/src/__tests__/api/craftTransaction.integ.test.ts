import { Account, Aptos, type Ed25519Account, Network, Hex } from "@aptos-labs/ts-sdk";
import type { AptosAsset, AptosExtra, AptosSender } from "../../types/assets";
import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from "../../api";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

describe("craftTransaction", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const accountA: Ed25519Account = Account.generate();
  console.log(accountA);

  const SENDER: AptosSender = {
    xpub: accountA.publicKey.toString(),
    freshAddress: accountA.accountAddress.toString(),
  };
  const RECIPIENT = Account.generate().accountAddress.toString();
  const api = createApi({
    aptosSettings: {
      network: Network.DEVNET,
    },
  });

  it("creates a valid transaction", async () => {
    mockedAptos.mockImplementation(() => ({
      getLedgerInfo: jest.fn().mockReturnValue({}),
    }));

    const txArg: TransactionIntent<AptosAsset, AptosExtra, AptosSender> = {
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 10n,
      asset: { type: "native" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx)).toBeTruthy();
  });
});
