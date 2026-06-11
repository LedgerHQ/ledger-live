import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { address as TyphonAddress, types as TyphonTypes } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { getDelegationFixture, STAKING_ADDRESS } from "../fixtures/delegation";
import { extractPaymentKeyFromAddress, extractStakeKeyFromAddress } from "../utils";
import { getStakes } from "./getStakes";

jest.mock("../api/getDelegationInfo");

const mockGetDelegation = jest.mocked(getDelegationInfo);

const currency = getCryptoCurrencyById("cardano");
// Non-null: STAKING_ADDRESS is a base address, so it always carries a stake credential.
const STAKE_KEY = extractStakeKeyFromAddress(STAKING_ADDRESS)!;
// Enterprise (payment-only) address built from STAKING_ADDRESS's payment credential: no stake credential.
const ENTERPRISE = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.MAINNET, {
  hash: Buffer.from(extractPaymentKeyFromAddress(STAKING_ADDRESS), "hex"),
  type: TyphonTypes.HashType.ADDRESS,
}).getBech32();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getStakes", () => {
  it("returns a single active stake for a delegated address", async () => {
    mockGetDelegation.mockResolvedValue(getDelegationFixture());

    const { items, next } = await getStakes(currency, STAKING_ADDRESS);

    expect(mockGetDelegation).toHaveBeenCalledWith(currency, STAKE_KEY);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      uid: STAKE_KEY,
      address: STAKING_ADDRESS,
      delegate: "pool1xyz",
      state: "active",
      amountDeposited: 2_000_000n,
      amountRewarded: 0n,
      amount: 2_000_000n,
      actions: ["delegate", "undelegate"],
    });
    expect(next).toBeUndefined();
  });

  it("surfaces rewards as amountRewarded without advertising a claim action", async () => {
    mockGetDelegation.mockResolvedValue(
      getDelegationFixture({ rewards: new BigNumber(5_000_000), dRepHex: "drep1abc" }),
    );

    const { items } = await getStakes(currency, STAKING_ADDRESS);

    expect(items[0].amountRewarded).toBe(5_000_000n);
    expect(items[0].actions).not.toContain("claim_reward");
    expect(items[0].actions).toEqual(["delegate", "undelegate"]);
  });

  it("returns an empty page when the address has a stake key but no delegation", async () => {
    mockGetDelegation.mockResolvedValue(undefined);

    const { items } = await getStakes(currency, STAKING_ADDRESS);

    expect(mockGetDelegation).toHaveBeenCalled();
    expect(items).toEqual([]);
  });

  it("returns an empty page without querying delegation for an address with no stake credential", async () => {
    const { items } = await getStakes(currency, ENTERPRISE);

    expect(items).toEqual([]);
    expect(mockGetDelegation).not.toHaveBeenCalled();
  });
});
