import BigNumber from "bignumber.js";
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

  it("returns correct value", async () => {
    // Given
    const account = {
      xpub: "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
      address: "tz1UHux4ijk2Qu6Ee3dDpka4vnAiEhiDLZMa",
      balance: BigNumber("2000000"),
      revealed: false,
    };
    const transaction = {
      mode: "send",
      recipient: "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
      amount: 1_000_000,
    } satisfies CoreTransactionInfo;

    // When
    const result = await estimateFees({ account, transaction });

    // Then
    expect(result).toEqual({
      estimatedFees: BigNumber("666"),
      fees: BigNumber("292"),
      gasLimit: BigNumber("169"),
      storageLimit: BigNumber("277"),
    });
  });

  it("returns correct value when useAllAmount", async () => {
    // Given
    const account = {
      xpub: "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
      address: "tz1UHux4ijk2Qu6Ee3dDpka4vnAiEhiDLZMa",
      balance: BigNumber("2000000"),
      revealed: false,
    };
    const transaction = {
      mode: "send",
      recipient: "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
      amount: 1_000_000,
      useAllAmount: true,
    } satisfies CoreTransactionInfo;

    // When
    const result = await estimateFees({ account, transaction });

    // Then
    expect(result).toEqual({
      estimatedFees: BigNumber("867"),
      fees: BigNumber("493"),
      gasLimit: BigNumber("669"),
      storageLimit: BigNumber("277"),
      amount: BigNumber("1929883"),
    });
  });
});
