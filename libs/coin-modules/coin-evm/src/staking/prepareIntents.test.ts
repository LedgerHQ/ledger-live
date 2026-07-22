import { ethers } from "ethers";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";
import zeroGravityAbi from "../abis/zero_gravity-validator.abi.json";
import { prepareStakingIntent } from "./prepareIntents";

jest.mock("../config", () => ({ __esModule: true, getCoinConfig: jest.fn() }));
jest.mock("../network/node/rpc.common", () => ({ __esModule: true, withApi: jest.fn() }));
jest.mock("../network/node/types", () => ({ __esModule: true, isExternalNodeConfig: jest.fn() }));
jest.mock("./validators/monad", () => ({ __esModule: true, findFirstFreeWithdrawId: jest.fn() }));

const mockedGetCoinConfig = jest.mocked(getCoinConfig);
const mockedWithApi = jest.mocked(withApi);
const mockedIsExternalNodeConfig = jest.mocked(isExternalNodeConfig);

const makeIntent = (overrides: Record<string, unknown> = {}) =>
  ({
    intentType: "staking",
    type: "staking-legacy",
    mode: "undelegate",
    amount: 1_000_000_000_000_000_000n,
    asset: { type: "native" },
    recipient: "0x0000000000000000000000000000000000000001",
    sender: "0x0000000000000000000000000000000000000002",
    valAddress: "0x0000000000000000000000000000000000000001",
    data: { type: "buffer", value: Buffer.from([]) },
    useAllAmount: false,
    ...overrides,
  }) as never;

function makeCallHandler(options: {
  getDelegationShares?: bigint;
  convertToSharesResult?: bigint;
  withdrawalFeeGwei?: bigint;
}) {
  const iface = new ethers.Interface(zeroGravityAbi as ethers.InterfaceAbi);
  return jest.fn(async ({ data }: { data?: string }) => {
    const desc = iface.parseTransaction({ data: data ?? "0x" });
    if (desc?.name === "getDelegation") {
      return iface.encodeFunctionResult("getDelegation", [
        "0x0000000000000000000000000000000000000000",
        options.getDelegationShares ?? 0n,
      ]);
    }
    if (desc?.name === "convertToShares") {
      return iface.encodeFunctionResult("convertToShares", [options.convertToSharesResult ?? 0n]);
    }
    if (desc?.name === "withdrawalFeeInGwei") {
      return iface.encodeFunctionResult("withdrawalFeeInGwei", [options.withdrawalFeeGwei ?? 0n]);
    }
    throw new Error(`unexpected call: ${desc?.name}`);
  });
}

function setupProvider(callHandler: ReturnType<typeof jest.fn>) {
  mockedWithApi.mockImplementation(async (_currency, fn) => fn({ call: callHandler } as never));
}

describe("prepareStakingIntent / zero_gravity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCoinConfig.mockReturnValue({
      info: { node: { type: "external", uri: "https://zero-gravity.coin.ledger.com" } },
    } as never);
    mockedIsExternalNodeConfig.mockReturnValue(true);
  });

  it("partial undelegate: calls getDelegation then convertToShares, sets shares + txValue", async () => {
    setupProvider(
      makeCallHandler({
        getDelegationShares: 2_000_000_000n,
        convertToSharesResult: 1_500_000_000n,
        withdrawalFeeGwei: 5n,
      }),
    );

    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ useAllAmount: false }),
    );

    expect(result).toMatchObject({ shares: 1_500_000_000n, txValue: 5n * 10n ** 9n });
  });

  it("partial undelegate: throws when delegator has no shares", async () => {
    setupProvider(makeCallHandler({ getDelegationShares: 0n }));

    await expect(
      prepareStakingIntent(
        { id: "zero_gravity" } as CryptoCurrency,
        makeIntent({ useAllAmount: false }),
      ),
    ).rejects.toThrow("no shares to undelegate from this validator");
  });

  it("partial undelegate: snaps to availableShares when convertToShares returns availableShares - 1 (vault rounding)", async () => {
    setupProvider(
      makeCallHandler({
        getDelegationShares: 2_000_000_000n,
        convertToSharesResult: 1_999_999_999n,
        withdrawalFeeGwei: 0n,
      }),
    );

    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ useAllAmount: false }),
    );

    expect(result).toMatchObject({ shares: 2_000_000_000n });
  });

  it("partial undelegate: falls back to availableShares when amount converts to zero shares (dust)", async () => {
    setupProvider(
      makeCallHandler({
        getDelegationShares: 1_000_000_000n,
        convertToSharesResult: 0n,
        withdrawalFeeGwei: 0n,
      }),
    );

    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ useAllAmount: false }),
    );

    expect(result).toMatchObject({ shares: 1_000_000_000n });
  });

  it("partial undelegate: throws when requested shares exceed available shares (exchange rate shift)", async () => {
    setupProvider(
      makeCallHandler({
        getDelegationShares: 1_000_000_000n,
        convertToSharesResult: 2_000_000_000n,
        withdrawalFeeGwei: 5n,
      }),
    );

    await expect(
      prepareStakingIntent(
        { id: "zero_gravity" } as CryptoCurrency,
        makeIntent({ useAllAmount: false }),
      ),
    ).rejects.toThrow("requested amount exceeds delegated shares");
  });

  it("throws when shares are below the 0G contract minimum", async () => {
    setupProvider(
      makeCallHandler({
        getDelegationShares: 500_000_000n,
        convertToSharesResult: 500_000_000n,
        withdrawalFeeGwei: 0n,
      }),
    );

    await expect(
      prepareStakingIntent(
        { id: "zero_gravity" } as CryptoCurrency,
        makeIntent({ useAllAmount: false }),
      ),
    ).rejects.toThrow("shares below 0G contract minimum");
  });

  it("full undelegate (useAllAmount): calls getDelegation, uses returned shares", async () => {
    setupProvider(makeCallHandler({ getDelegationShares: 1_000_000_000n, withdrawalFeeGwei: 5n }));

    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ useAllAmount: true }),
    );

    expect(result).toMatchObject({ shares: 1_000_000_000n, txValue: 5n * 10n ** 9n });
  });

  it("is a no-op when shares is already set", async () => {
    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ shares: 42n }),
    );

    expect(result).toMatchObject({
      mode: "undelegate",
      valAddress: "0x0000000000000000000000000000000000000001",
      shares: 42n,
    });
    expect(mockedWithApi).not.toHaveBeenCalled();
  });

  it("is a no-op when mode is not undelegate", async () => {
    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent({ mode: "delegate" }),
    );

    expect(result).toMatchObject({
      mode: "delegate",
      valAddress: "0x0000000000000000000000000000000000000001",
    });
    expect(mockedWithApi).not.toHaveBeenCalled();
  });

  it("is a no-op when node is not external", async () => {
    mockedIsExternalNodeConfig.mockReturnValue(false);

    const result = await prepareStakingIntent(
      { id: "zero_gravity" } as CryptoCurrency,
      makeIntent(),
    );

    expect(result).toMatchObject({
      mode: "undelegate",
      valAddress: "0x0000000000000000000000000000000000000001",
    });
    expect(mockedWithApi).not.toHaveBeenCalled();
  });

  it("is a no-op for unknown currencies", async () => {
    const result = await prepareStakingIntent(
      { id: "unknown_chain" } as CryptoCurrency,
      makeIntent(),
    );

    expect(result).toMatchObject({
      mode: "undelegate",
      valAddress: "0x0000000000000000000000000000000000000001",
    });
  });
});
