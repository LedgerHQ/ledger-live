import * as network from "@ledgerhq/coin-algorand/network";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { filter, firstValueFrom } from "rxjs";
import { getCoinFrameworkAccountBridge } from "../../bridge/generic-coin-framework/accountBridge";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { algorandConfig } from "./config";

jest.mock("@ledgerhq/coin-algorand/network");

const ADDRESS = "AEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEA5RCDXMI";
// msgpack of `type: "axfer"` and `xaid: 123` in the crafted transaction
const ASSET_TRANSFER_TYPE = "a474797065a56178666572";
const ASSET_ID_123 = "a4786169647b";

describe("algorand opt-in through the generic bridge", () => {
  let unsigned: string | undefined;
  const signer: CoinFrameworkSigner = {
    getAddress: async () => ({ address: ADDRESS, publicKey: "", path: "" }),
    context: async (_deviceId, fn) =>
      fn({
        getAddress: async () => ({ address: ADDRESS, publicKey: "" }),
        signTransaction: async (_path: string, transaction: string) => {
          unsigned = transaction;
          return "07".repeat(64);
        },
      }),
  };

  beforeAll(() => {
    LiveConfig.setConfig(algorandConfig);
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });
    jest.mocked(network.getTransactionParams).mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1,
      lastRound: 2,
      genesisHash: Buffer.alloc(32, 2).toString("base64"),
      genesisID: "mainnet-v1.0",
    });
  });

  it("prepares, validates and signs an asset transfer of the selected ASA", async () => {
    const account: Account = {
      ...genAccount("algorand-opt-in", { currency: getCryptoCurrencyById("algorand") }),
      freshAddress: ADDRESS,
      balance: new BigNumber(1_000_000),
      spendableBalance: new BigNumber(900_000),
      subAccounts: [],
      pendingOperations: [],
    };
    const bridge = await getCoinFrameworkAccountBridge("algorand", "local", signer);

    const transaction = await bridge.prepareTransaction(
      account,
      bridge.updateTransaction(bridge.createTransaction(account), {
        mode: "changeTrust",
        assetReference: "123",
        assetOwner: ADDRESS,
      }),
    );
    const status = await bridge.getTransactionStatus(account, transaction);
    const signed = await firstValueFrom(
      bridge
        .signOperation({ account, transaction, deviceId: "" })
        .pipe(filter((e: SignOperationEvent) => e.type === "signed")),
    );

    expect(status.errors).toEqual({});
    expect(unsigned).toContain(ASSET_TRANSFER_TYPE);
    expect(unsigned).toContain(ASSET_ID_123);
    expect(signed.type === "signed" && signed.signedOperation.operation.type).toBe("OPT_IN");
  });
});
