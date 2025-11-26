import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { lockedGold, nonVoting, electionConfig } from "./__mocks__/celokit.mock";
import { getAccountShape } from "./synchronisation";

const getAccount = jest.fn();

jest.mock("./account-sync-helpers", () => {
  return {
    getAccount: () => getAccount(),
  };
});

const mockListOfOps = [
  {
    id: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:-0x9bca21a15bc5f8b073eb488ecba36e214cbff0efb21258d4c502cc0e8e80e3f1-OUT",
    hash: "0x9bca21a15bc5f8b073eb488ecba36e214cbff0efb21258d4c502cc0e8e80e3f1",
    type: "OUT",
    senders: ["0x79D5A290D7ba4b99322d91b577589e8d0BF87072"],
    recipients: ["0x8D6677192144292870907E3Fa8A5527fE55A7ff6"],
    accountId: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:",
    blockHash: "0xd7a0438d5b9edd9588a2aee375cede92f9dc7654d1c88e38aac10cc97d7ebbaa",
    blockHeight: 51840387,
    extra: {},
    date: "2025-11-21T16:05:45.000Z",
    value: "7743784739000000",
    fee: "7743784739000000",
    transactionSequenceNumber: "116",
    hasFailed: false,
  },
];

const info = {
  address: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
  currency: getCryptoCurrencyById("celo"),
  index: 0,
  derivationPath: "44'/52752'/0'",
  derivationMode: "",
  initialAccount: undefined,
} as const;
const config = { blacklistedTokenIds: [], paginationConfig: {} };

const defaultShape = {
  balance: new BigNumber(1010),
  spendableBalance: new BigNumber(20),
  operations: [],
  subAccounts: [],
  blockHeight: 100,
  syncHash: "0x000000000",
  id: "celo:2:0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
};

lockedGold.mockResolvedValue(new BigNumber(0));
nonVoting.mockResolvedValue(new BigNumber(0));
electionConfig.mockResolvedValue({ maxNumGroupsVotedFor: 10 });

describe("When getting the account shape", () => {
  it("returns the account with correct balance and spendable balance", async () => {
    // Given
    getAccount.mockResolvedValueOnce({ ...defaultShape });

    // When
    const result = await getAccountShape(info, config);

    // Then
    expect(result).toBeDefined();
    expect(result.balance).toEqual(BigNumber(1010));
    expect(result.spendableBalance).toEqual(BigNumber(20));
  });

  it("returns the account with 0 operations", async () => {
    // Given
    getAccount.mockResolvedValueOnce({ ...defaultShape });

    // When
    const result = await getAccountShape(info, config);

    // Then
    expect(result).toBeDefined();
    expect(result.operations?.length).toBe(0);
  });

  it("returns the account with 1 operations", async () => {
    getAccount.mockResolvedValueOnce({ ...defaultShape, operations: mockListOfOps });
    // Given
    const info = {
      address: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      currency: getCryptoCurrencyById("celo"),
      index: 0,
      derivationPath: "44'/52752'/0'",
      derivationMode: "",
      initialAccount: undefined,
    } as const;
    const config = { blacklistedTokenIds: [], paginationConfig: {} };

    // When
    const result = await getAccountShape(info, config);

    // Then
    expect(result).toBeDefined();
    expect(result.operations?.length).toBe(1);
  });

  it("returns the account with correct id, and celo resources", async () => {
    getAccount.mockResolvedValueOnce({ ...defaultShape, operations: mockListOfOps });
    // Given
    const info = {
      address: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      currency: getCryptoCurrencyById("celo"),
      index: 0,
      derivationPath: "44'/52752'/0'",
      derivationMode: "",
      initialAccount: undefined,
    } as const;
    const config = { blacklistedTokenIds: [], paginationConfig: {} };

    // When
    const result = await getAccountShape(info, config);

    // Then
    expect(result).toBeDefined();
    expect(result.id).toEqual("js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:");
    expect(result.celoResources?.electionAddress).toEqual(
      "0x000000000000000000000000000000000000ce10",
    );
    expect(result.celoResources?.lockedGoldAddress).toEqual(
      "0x0000000000000000000000000000000000001d00",
    );
    expect(result.spendableBalance).toEqual(BigNumber(20));
  });
});
