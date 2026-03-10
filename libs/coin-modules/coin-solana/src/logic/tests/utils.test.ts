import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { PublicKey } from "@solana/web3.js";
import type { SolanaStake } from "../../types";
import {
  isValidBase58Address,
  isEd25519Address,
  encodeAccountIdWithTokenAccountAddress,
  decodeAccountIdWithTokenAccountAddress,
  stakeActions,
  withdrawableFromStake,
  isStakeLockUpInForce,
  stakeActivePercent,
  getCALHash,
  setCALHash,
  __resetCALHash,
} from "../utils";

describe("isValidBase58Address", () => {
  it("should return true for a valid Solana address", () => {
    expect(isValidBase58Address("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM")).toBe(true);
  });

  it("should return false for an invalid address", () => {
    expect(isValidBase58Address("not-a-valid-address!!!")).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isValidBase58Address("")).toBe(false);
  });
});

describe("isEd25519Address", () => {
  it("should return true for an on-curve address", () => {
    expect(isEd25519Address("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM")).toBe(true);
  });

  it("should return false for a program-derived address (off-curve)", () => {
    const pda = PublicKey.findProgramAddressSync(
      [Buffer.from("seed")],
      new PublicKey("11111111111111111111111111111111"),
    )[0];
    expect(isEd25519Address(pda.toBase58())).toBe(false);
  });
});

describe("encodeAccountIdWithTokenAccountAddress / decodeAccountIdWithTokenAccountAddress", () => {
  it("should encode and decode roundtrip", () => {
    const accountId = "js:2:solana:HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM:";
    const tokenAddr = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

    const encoded = encodeAccountIdWithTokenAccountAddress(accountId, tokenAddr);
    expect(encoded).toBe(`${accountId}+${tokenAddr}`);

    const decoded = decodeAccountIdWithTokenAccountAddress(encoded);
    expect(decoded.accountId).toBe(accountId);
    expect(decoded.address).toBe(tokenAddr);
  });

  it("should handle accountId containing '+' character", () => {
    const accountId = "some+complex+id";
    const address = "tokenAddr";
    const encoded = encodeAccountIdWithTokenAccountAddress(accountId, address);
    const decoded = decodeAccountIdWithTokenAccountAddress(encoded);
    expect(decoded.accountId).toBe(accountId);
    expect(decoded.address).toBe(address);
  });
});

describe("stakeActions", () => {
  const baseStake = {
    stakeAccAddr: "addr",
    hasStakeAuth: true,
    hasWithdrawAuth: true,
    delegation: { stake: 1000, voteAccAddr: "vote" },
    stakeAccBalance: 10000,
    rentExemptReserve: 2282880,
    withdrawable: 0,
    activation: { state: "active" as const, active: 7000, inactive: 0 },
  };

  it("should return ['deactivate'] for active stake with no withdrawable", () => {
    const actions = stakeActions(baseStake);
    expect(actions).toEqual(["deactivate"]);
  });

  it("should return ['withdraw', 'deactivate'] for active stake with withdrawable > 0", () => {
    const stake: SolanaStake = { ...baseStake, withdrawable: 100 };
    const actions = stakeActions(stake);
    expect(actions).toEqual(["withdraw", "deactivate"]);
  });

  it("should return ['deactivate'] for activating stake", () => {
    const stake: SolanaStake = {
      ...baseStake,
      activation: { state: "activating", active: 3000, inactive: 4000 },
    };
    expect(stakeActions(stake)).toEqual(["deactivate"]);
  });

  it("should return ['reactivate'] for deactivating stake", () => {
    const stake: SolanaStake = {
      ...baseStake,
      activation: { state: "deactivating", active: 3000, inactive: 4000 },
    };
    expect(stakeActions(stake)).toEqual(["reactivate"]);
  });

  it("should return ['activate'] for inactive stake", () => {
    const stake: SolanaStake = {
      ...baseStake,
      activation: { state: "inactive", active: 0, inactive: 7000 },
    };
    expect(stakeActions(stake)).toEqual(["activate"]);
  });

  it("should return ['withdraw', 'reactivate'] for deactivating stake with withdrawable > 0", () => {
    const stake: SolanaStake = {
      ...baseStake,
      withdrawable: 500,
      activation: { state: "deactivating", active: 3000, inactive: 4000 },
    };
    expect(stakeActions(stake)).toEqual(["withdraw", "reactivate"]);
  });

  it("should throw for unknown activation state (exhaustive check)", () => {
    const stake = {
      ...baseStake,
      activation: { state: "unknown" as never, active: 0, inactive: 0 },
    } as SolanaStake;
    expect(() => stakeActions(stake)).toThrow();
  });
});

describe("withdrawableFromStake", () => {
  const rentExemptReserve = 2282880;

  it("should return inactive balance for active stake", () => {
    expect(
      withdrawableFromStake({
        stakeAccBalance: 10000000,
        activation: { state: "active", active: 7000000, inactive: 717120 },
        rentExemptReserve,
      }),
    ).toBe(717120);
  });

  it("should return inactive balance for activating stake", () => {
    expect(
      withdrawableFromStake({
        stakeAccBalance: 10000000,
        activation: { state: "activating", active: 5000000, inactive: 2717120 },
        rentExemptReserve,
      }),
    ).toBe(2717120);
  });

  it("should return inactive balance for deactivating stake", () => {
    expect(
      withdrawableFromStake({
        stakeAccBalance: 10000000,
        activation: { state: "deactivating", active: 3000000, inactive: 4717120 },
        rentExemptReserve,
      }),
    ).toBe(4717120);
  });

  it("should return full balance for inactive stake", () => {
    expect(
      withdrawableFromStake({
        stakeAccBalance: 10000000,
        activation: { state: "inactive", active: 0, inactive: 7717120 },
        rentExemptReserve,
      }),
    ).toBe(10000000);
  });

  it("should return 0 when active equals balance minus rent", () => {
    expect(
      withdrawableFromStake({
        stakeAccBalance: 9282880,
        activation: { state: "active", active: 7000000, inactive: 0 },
        rentExemptReserve,
      }),
    ).toBe(0);
  });

  it("should throw for unknown activation state (exhaustive check)", () => {
    expect(() =>
      withdrawableFromStake({
        stakeAccBalance: 10000000,
        activation: { state: "unknown" as never, active: 0, inactive: 0 },
        rentExemptReserve,
      }),
    ).toThrow();
  });
});

describe("isStakeLockUpInForce", () => {
  const custodianPubkey = new PublicKey("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM");

  it("should return false when custodianAddress matches lockup custodian", () => {
    expect(
      isStakeLockUpInForce({
        lockup: { custodian: custodianPubkey, unixTimestamp: 9999999999, epoch: 9999 },
        custodianAddress: custodianPubkey.toBase58(),
        epoch: 0,
      }),
    ).toBe(false);
  });

  it("should return true when lockup timestamp is in the future", () => {
    expect(
      isStakeLockUpInForce({
        lockup: {
          custodian: new PublicKey("11111111111111111111111111111111"),
          unixTimestamp: Date.now() / 1000 + 86400,
          epoch: 0,
        },
        custodianAddress: custodianPubkey.toBase58(),
        epoch: 100,
      }),
    ).toBe(true);
  });

  it("should return true when lockup epoch is greater than current epoch", () => {
    expect(
      isStakeLockUpInForce({
        lockup: {
          custodian: new PublicKey("11111111111111111111111111111111"),
          unixTimestamp: 0,
          epoch: 200,
        },
        custodianAddress: custodianPubkey.toBase58(),
        epoch: 100,
      }),
    ).toBe(true);
  });

  it("should return false when lockup timestamp and epoch are both passed", () => {
    expect(
      isStakeLockUpInForce({
        lockup: {
          custodian: new PublicKey("11111111111111111111111111111111"),
          unixTimestamp: 0,
          epoch: 0,
        },
        custodianAddress: custodianPubkey.toBase58(),
        epoch: 100,
      }),
    ).toBe(false);
  });
});

describe("stakeActivePercent", () => {
  const baseStake: SolanaStake = {
    stakeAccAddr: "addr",
    hasStakeAuth: true,
    hasWithdrawAuth: true,
    delegation: { stake: 1000, voteAccAddr: "vote" },
    stakeAccBalance: 10000,
    rentExemptReserve: 2282880,
    withdrawable: 0,
    activation: { state: "active", active: 500, inactive: 500 },
  };

  it("should return correct percentage when partially active", () => {
    expect(stakeActivePercent(baseStake)).toBe(50);
  });

  it("should return 100 when fully active", () => {
    const stake: SolanaStake = {
      ...baseStake,
      activation: { state: "active", active: 1000, inactive: 0 },
    };
    expect(stakeActivePercent(stake)).toBe(100);
  });

  it("should return 0 when delegation stake is 0", () => {
    const stake: SolanaStake = {
      ...baseStake,
      delegation: { stake: 0, voteAccAddr: "vote" },
    };
    expect(stakeActivePercent(stake)).toBe(0);
  });

  it("should return 0 when delegation is undefined", () => {
    const stake: SolanaStake = {
      ...baseStake,
      delegation: undefined,
    };
    expect(stakeActivePercent(stake)).toBe(0);
  });
});

describe("CALHash management", () => {
  const mockCurrency = { id: "solana" } as CryptoCurrency;

  afterEach(() => {
    __resetCALHash();
  });

  it("should return empty string when no hash is set", () => {
    expect(getCALHash(mockCurrency)).toBe("");
  });

  it("should store and retrieve a hash", () => {
    setCALHash(mockCurrency, "abc123");
    expect(getCALHash(mockCurrency)).toBe("abc123");
  });

  it("should overwrite existing hash", () => {
    setCALHash(mockCurrency, "first");
    setCALHash(mockCurrency, "second");
    expect(getCALHash(mockCurrency)).toBe("second");
  });

  it("should return the stored hash from setCALHash", () => {
    const result = setCALHash(mockCurrency, "hashValue");
    expect(result).toBe("hashValue");
  });

  it("should clear all hashes on reset", () => {
    setCALHash(mockCurrency, "value");
    __resetCALHash();
    expect(getCALHash(mockCurrency)).toBe("");
  });
});
