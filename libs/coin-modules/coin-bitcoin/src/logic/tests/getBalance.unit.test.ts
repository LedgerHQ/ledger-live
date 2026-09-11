import BigNumber from "bignumber.js";
import { getBalance } from "../getBalance";
import * as buildAccount from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

jest.mock("../buildAccount");

const mockedBuild = buildAccount.buildSyncedAccount as jest.MockedFunction<
  typeof buildAccount.buildSyncedAccount
>;

const context = {} as unknown as BitcoinContext;

describe("logic/getBalance", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns a single native balance aggregated over the whole account", async () => {
    mockedBuild.mockResolvedValue({
      xpub: { getXpubBalance: async () => new BigNumber("123456") },
    } as unknown as Awaited<ReturnType<typeof buildAccount.buildSyncedAccount>>);

    const result = await getBalance(context, "bitcoin", "zpub6xxxx", "84'/0'/0'");

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(123456n);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(mockedBuild).toHaveBeenCalledWith("bitcoin", "zpub6xxxx", "84'/0'/0'");
  });
});
