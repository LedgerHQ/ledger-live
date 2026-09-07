/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { createLocalStellarApi } from "./coinModuleApi";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";

jest.mock("@ledgerhq/coin-stellar/api/index", () => ({
  createApi: jest.fn(),
}));

const mockCreateStellarApi = createStellarApi as jest.Mock;

describe("stellar coinModuleApi memo adapter", () => {
  const craftTransaction = jest.fn();
  const validateIntent = jest.fn();
  const context = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateStellarApi.mockReturnValue({ craftTransaction, validateIntent });
  });

  it("translates a StringMemo to Stellar's { type: kind, value } for craftTransaction", () => {
    createLocalStellarApi("stellar").craftTransaction(context, {
      memo: { type: "string", kind: "MEMO_TEXT", value: "hello" },
    } as any);

    expect(craftTransaction).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ memo: { type: "MEMO_TEXT", value: "hello" } }),
      undefined,
    );
  });

  it("translates MemoNotSupported to Stellar's NO_MEMO sentinel for validateIntent", () => {
    createLocalStellarApi("stellar").validateIntent(context, { memo: { type: "none" } } as any, []);

    expect(validateIntent).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ memo: { type: "NO_MEMO" } }),
      [],
      undefined,
    );
  });

  it("leaves every non-memo intent field intact", () => {
    createLocalStellarApi("stellar").craftTransaction(context, {
      sender: "GABC",
      recipient: "GDEF",
      amount: 1n,
      memo: { type: "string", kind: "MEMO_ID", value: "42" },
    } as any);

    expect(craftTransaction).toHaveBeenCalledWith(
      context,
      {
        sender: "GABC",
        recipient: "GDEF",
        amount: 1n,
        memo: { type: "MEMO_ID", value: "42" },
      },
      undefined,
    );
  });
});
