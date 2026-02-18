import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import coinConfig from "../config";
import * as node from "./node";
import { getAccount, getBalances, getRegistry } from "./sidecar";
import mockServer, { SIDECAR_BASE_URL_TEST } from "./sidecar.mock";
import { SidecarAccountBalanceInfo, SidecarStakingInfo } from "./types";

jest.mock("./node", () => ({
  fetchConstants: jest.fn(),
  fetchStakingInfo: jest.fn(),
  fetchValidators: jest.fn(),
  fetchNominations: jest.fn(),
}));

beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
const currency = getCryptoCurrencyById("assethub_polkadot");

describe("getAccount", () => {
  let balanceResponseStub: Partial<SidecarAccountBalanceInfo> = {};

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://httpbin.org/",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub",
      },
      metadataShortener: {
        id: "dot-hub",
        url: "",
      },
      metadataHash: {
        url: "",
      },
      hasBeenMigrated: true,
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/accounts/:addr/balance-info`, () => {
        return HttpResponse.json(balanceResponseStub);
      }),
    );
  });

  it("should return no staking info when no controller found", async () => {
    balanceResponseStub = {
      at: {
        height: "0",
        hash: "",
      },
      nonce: "1",
      transferable: "10000000000",
      reserved: "220000000000", // bonded
      free: "30000000000",
    };

    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/activeEra`, () => {
        return HttpResponse.json(undefined);
      }),
    );

    const lockedBalance = new BigNumber(balanceResponseStub.reserved!);
    const computedBalance = new BigNumber(balanceResponseStub.free!).plus(lockedBalance);

    const account = await getAccount("addr", currency);
    expect(account).toMatchObject({
      blockHeight: Number(balanceResponseStub.at!.height),
      balance: computedBalance,
      spendableBalance: new BigNumber(balanceResponseStub.transferable!),
      nonce: Number(balanceResponseStub.nonce!),
      lockedBalance: lockedBalance,
      controller: null,
      stash: null,
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
    });
  });

  it("should return no staking info when account is not a stash", async () => {
    balanceResponseStub = {
      at: {
        height: "0",
        hash: "",
      },
      nonce: "1",
      transferable: "10000000000",
      reserved: "220000000000", // bonded
      free: "30000000000",
    };

    jest
      .spyOn(node.default, "fetchStakingInfo")
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      .mockResolvedValue(undefined as unknown as SidecarStakingInfo);

    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/bonded`, ({ request }) => {
        const url = new URL(request.url);
        const keys = url.searchParams.get("keys[]");
        const key1 = url.searchParams.get("key1");

        if (keys === "addr" && key1 === "addr") {
          return HttpResponse.json({ value: {} });
        }

        return HttpResponse.json(undefined);
      }),
    );

    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/activeEra`, () => {
        return HttpResponse.json({});
      }),
    );

    const lockedBalance = new BigNumber(balanceResponseStub.reserved!);
    const computedBalance = new BigNumber(balanceResponseStub.free!).plus(lockedBalance);

    const account = await getAccount("addr", currency);
    expect(account).toMatchObject({
      blockHeight: Number(balanceResponseStub.at!.height),
      balance: computedBalance,
      spendableBalance: new BigNumber(balanceResponseStub.transferable!),
      nonce: Number(balanceResponseStub.nonce!),
      lockedBalance: lockedBalance,
      controller: {},
      stash: null,
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
    });
  });

  it("should correctly set balance and staking info of the account", async () => {
    balanceResponseStub = {
      at: {
        height: "0",
        hash: "",
      },
      nonce: "1",
      transferable: "10000000000",
      reserved: "220000000000", // bonded
      free: "30000000000",
    };

    const now = new Date();
    // Here, we count the number of day for the new year, to keep unlocking not unlocked yet
    // An estimation completion date is generated from this
    // So for unlocked, we put 1 to make them outdated
    // And for others, we put a number of day to make a completion date for next year (test will pass, nevermind the current date)
    const daysCountForNextYear = (now.getFullYear() + 2 - 1970) * 365;
    const stakingInfoResponseStub = {
      staking: {
        unlocking: [
          {
            // unbonded
            value: "40000000000",
            era: "1",
          },
          {
            // unbonded
            value: "50000000000",
            era: "1",
          },
          {
            // unbonding
            value: "60000000000",
            era: daysCountForNextYear,
          },
          {
            // unbonding
            value: "70000000000",
            era: daysCountForNextYear,
          },
        ],
      },
    };

    jest
      .spyOn(node.default, "fetchStakingInfo")
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      .mockResolvedValue(stakingInfoResponseStub as SidecarStakingInfo);

    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/bonded`, ({ request }) => {
        const url = new URL(request.url);
        const keys = url.searchParams.get("keys[]");
        const key1 = url.searchParams.get("key1");

        if (keys === "addr" && key1 === "addr") {
          return HttpResponse.json({ value: {} });
        }

        return HttpResponse.json(undefined);
      }),
    );
    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/pallets/staking/storage/activeEra`, () => {
        return HttpResponse.json({});
      }),
    );

    const lockedBalance = new BigNumber(balanceResponseStub.reserved!);
    const unlockedBalance = new BigNumber(stakingInfoResponseStub.staking.unlocking[0].value).plus(
      new BigNumber(stakingInfoResponseStub.staking.unlocking[1].value),
    );
    const unlockingBalance = new BigNumber(
      stakingInfoResponseStub.staking.unlocking
        .map(u => u.value)
        .reduce((value, newValue) => value + Number(newValue), 0),
    );
    const computedBalance = new BigNumber(balanceResponseStub.free!)
      .plus(lockedBalance.minus(unlockingBalance))
      .plus(unlockingBalance.minus(unlockedBalance));

    const account = await getAccount("addr", currency);
    expect(account).toMatchObject({
      blockHeight: Number(balanceResponseStub.at!.height),
      balance: computedBalance,
      spendableBalance: new BigNumber(balanceResponseStub.transferable!),
      nonce: Number(balanceResponseStub.nonce!),
      lockedBalance: lockedBalance,
      controller: {},
      stash: null,
      unlockedBalance: unlockedBalance,
      unlockingBalance: unlockingBalance,
    });
  });
});

describe("getBalances", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://httpbin.org/",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
      metadataShortener: {
        id: "dot",
        url: "",
      },
      metadataHash: {
        url: "",
      },
      indexer: {
        url: "",
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  it("should have no spendable balance nor locked balance when API does not return them", async () => {
    const balanceResponseStub = {
      at: {
        height: "0",
        hash: "",
      },
      nonce: "1",
      free: "30000000000",
    };

    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/accounts/:addr/balance-info`, () => {
        return HttpResponse.json(balanceResponseStub);
      }),
    );

    const account = await getBalances("addr");
    expect(account).toMatchObject({
      blockHeight: Number(balanceResponseStub.at!.height),
      balance: new BigNumber(balanceResponseStub.free!),
      spendableBalance: new BigNumber(0),
      nonce: Number(balanceResponseStub.nonce!),
      lockedBalance: new BigNumber(0),
    });
  });
});

describe("getRegistry", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://httpbin.org/",
      },
      indexer: {
        url: "https://polkadot.coin.ledger.com",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
      metadataShortener: {
        id: "dot",
        url: "",
      },
      metadataHash: {
        url: "",
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  it("works", async () => {
    const { registry, extrinsics } = await getRegistry(currency);
    expect(registry).not.toBeNull();
    expect(extrinsics).not.toBeNull();
  });
});
