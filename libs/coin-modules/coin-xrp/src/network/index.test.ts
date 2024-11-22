import network from "@ledgerhq/live-network";
import { getAccountInfo } from ".";
import coinConfig, { type XrpCoinConfig } from "../config";

jest.mock("@ledgerhq/live-network");

describe("getAccountInfo", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      () =>
        ({
          node: "",
        }) as XrpCoinConfig,
    );
  });

  it("returns an empty AccountInfo when returns an error 'actNotFound'", async () => {
    // Given
    const emptyAddress = "rNCgVpHinUDjXP2vHDFDMjm7ssBwpveHya";
    (network as jest.Mock).mockResolvedValue({
      data: {
        result: {
          account: emptyAddress,
          error: "actNotFound",
          error_code: 19,
          error_message: "Account not found.",
          ledger_hash: "F2E6EFD279C3663B62D9DC9977106EC25BA8F89DA551C2D7AB3AE5D75B146258",
          ledger_index: 91772714,
          request: {
            account: emptyAddress,
            command: "account_info",
            ledger_index: "validated",
          },
          status: "error",
          validated: true,
        },
      },
    });

    // When
    const result = await getAccountInfo(emptyAddress);

    // Then
    expect(result).toEqual({
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });
  });

  it("returns a valid AccountInfo when return a correct AccountInfo", async () => {
    // Given
    const address = "rh1HPuRVsYYvThxG2Bs1MfjmrVC73S16Fb";
    (network as jest.Mock).mockResolvedValue({
      data: {
        result: {
          account_data: {
            Account: address,
            Balance: "999441667919804",
            Flags: 0,
            LedgerEntryType: "AccountRoot",
            OwnerCount: 0,
            PreviousTxnID: "947F03794C982FE4C7C9FECC4C33C543BB25B82938895EBA8F9B6021CC27A571",
            PreviousTxnLgrSeq: 725208,
            Sequence: 153743,
            index: "BC0DAE09C0BFBC4A49AA94B849266588BFD6E1F554B184B5788AC55D6E07EB95",
          },
          ledger_hash: "93E952B2770233B0ABFBFBBFBC3E2E2159DCABD07FEB5F4C49174027935D9FBB",
          ledger_index: 1908009,
          status: "success",
          validated: true,
        },
      },
    });

    // When
    const result = await getAccountInfo(address);

    // Then
    expect(result).toEqual({
      isNewAccount: false,
      balance: "999441667919804",
      ownerCount: 0,
      sequence: 153743,
    });
  });

  it("throws an error when backend returns any other error", async () => {
    // Given
    const invalidAddress = "rNCgVpHinUDjXP2vHDFDMjm7ssBwpveHyaa";
    (network as jest.Mock).mockResolvedValue({
      result: {
        error: "actMalformed",
        error_code: 35,
        error_message: "Account malformed.",
        ledger_hash: "87DE2DD287BCAD6E81720BC6E6361EF01A66EE70A37B6BDF1EFF2E719D9410AE",
        ledger_index: 91772741,
        request: {
          account: invalidAddress,
          command: "account_info",
          ledger_index: "validated",
        },
        status: "error",
        validated: true,
      },
    });

    // When & Then
    await expect(getAccountInfo(invalidAddress)).rejects.toThrow(
      "Cannot read properties of undefined (reading 'result')",
    );
  });
});
