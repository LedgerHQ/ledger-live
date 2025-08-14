import { CoreTransactionInfo, estimateFees } from "./estimateFees";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";

describe("estimateFees", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  const accounts = [
    {
      xpub: "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
      address: "tz1UHux4ijk2Qu6Ee3dDpka4vnAiEhiDLZMa",
      balance: BigInt("2000000"),
      revealed: false,
    },
    {
      // No xpub provided
      address: "tz1UHux4ijk2Qu6Ee3dDpka4vnAiEhiDLZMa",
      balance: BigInt("2000000"),
      revealed: false,
    },
  ];

  it.each(accounts)("returns correct value", async account => {
    // Given
    const transaction = {
      mode: "send",
      recipient: "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
      amount: BigInt(1_000_000),
    } satisfies CoreTransactionInfo;

    // When
    const result = await estimateFees({ account, transaction });
    // Then
    expect(result).toEqual({
      estimatedFees: BigInt("866"),
      fees: BigInt("492"),
      gasLimit: BigInt("2169"),
      storageLimit: BigInt("277"),
      amount: BigInt("1000000"),
    });
  });

  it.each(accounts)("returns correct value when useAllAmount", async account => {
    // Given
    const transaction = {
      mode: "send",
      recipient: "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
      amount: BigInt(1_000_000),
      useAllAmount: true,
    } satisfies CoreTransactionInfo;

    // When
    const result = await estimateFees({ account, transaction });

    // Then
    expect(result).toEqual({
      estimatedFees: BigInt("864"),
      fees: BigInt("490"),
      gasLimit: BigInt("2169"),
      storageLimit: BigInt("277"),
      amount: BigInt("1934589"),
    });
  });
});
