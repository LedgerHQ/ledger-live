import { CoreTransactionInfo, estimateFees } from "./estimateFees";
import coinConfig, { TezosCoinConfig } from "../config";

describe("estimateFees", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): TezosCoinConfig => ({
        status: { type: "active" },
        baker: {
          url: "https://tezos-bakers.api.live.ledger.com",
        },
        explorer: {
          url: "https://xtz-tzkt-explorer.api.live.ledger.com",
          maxTxQuery: 100,
        },
        node: {
          url: "https://xtz-node.api.live.ledger.com",
        },
      }),
    );
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
      estimatedFees: BigInt("666"),
      fees: BigInt("292"),
      gasLimit: BigInt("169"),
      storageLimit: BigInt("277"),
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
      estimatedFees: BigInt("867"),
      fees: BigInt("493"),
      gasLimit: BigInt("669"),
      storageLimit: BigInt("277"),
      amount: BigInt("1929883"),
    });
  });
});
