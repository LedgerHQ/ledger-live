import { getAccount } from "../../network";
import { createMockVechainContext, mockVechainConfig } from "../../test/context";
import { getBalance, NATIVE_ASSET, vthoAsset } from "./getBalance";

jest.mock("../../network", () => ({ getAccount: jest.fn() }));

const ADDRESS = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";
const context = createMockVechainContext();

describe("getBalance", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns VET and VTHO balances parsed from the account response", async () => {
    jest.mocked(getAccount).mockResolvedValueOnce({
      balance: "0x1bc16d674ec80000",
      energy: "0xde0b6b3a7640000",
      hasCode: false,
    });

    const balances = await getBalance(context, ADDRESS);

    expect(getAccount).toHaveBeenCalledWith(mockVechainConfig, ADDRESS);
    expect(balances).toEqual([
      { value: BigInt("0x1bc16d674ec80000"), asset: NATIVE_ASSET },
      { value: BigInt("0xde0b6b3a7640000"), asset: vthoAsset(ADDRESS) },
    ]);
  });

  it("defaults both balances to 0 for a pristine account", async () => {
    jest.mocked(getAccount).mockResolvedValueOnce({ balance: "", energy: "", hasCode: false });

    const balances = await getBalance(context, ADDRESS);

    expect(balances).toEqual([
      { value: 0n, asset: NATIVE_ASSET },
      { value: 0n, asset: vthoAsset(ADDRESS) },
    ]);
  });

  it("returns a token asset for VTHO distinguished from the native asset", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValueOnce({ balance: "0x1", energy: "0x2", hasCode: false });

    const [nativeBalance, tokenBalance] = await getBalance(context, ADDRESS);

    expect(nativeBalance.asset.type).toBe("native");
    expect(tokenBalance.asset.type).not.toBe("native");
  });
});
