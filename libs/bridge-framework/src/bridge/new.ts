import { CurrencyNotSupported } from "@ledgerhq/errors";
import { decodeAccountId, getMainAccount } from "@ledgerhq/coin-framework/lib/account";
import { checkAccountSupported } from "@ledgerhq/coin-framework/lib/account/support";
import { DeviceCommunication } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import polkadotBridge from "@ledgerhq/coin-polkadot/lib/bridge/js";
import {
  PolkadotAccount,
  PolkadotAccountRaw,
  Transaction as PolkadotTransaction
} from "@ledgerhq/coin-polkadot/lib/types"
import * as PolkadotAccountFn from "@ledgerhq/coin-polkadot/lib/account";
import polkadotDeviceTransactionCfg from "@ledgerhq/coin-polkadot/lib/deviceTransactionConfig";
import { fromPolkadotResourcesRaw, toPolkadotResourcesRaw } from "@ledgerhq/coin-polkadot/lib/serialization";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/lib/transaction/common";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountBridge,
  AccountLike,
  AccountRaw,
  CurrencyBridge,
  TransactionCommon,
  TransactionStatusCommon
} from "@ledgerhq/types-live";

//-- FOR TEST PURPOSE ONLY
type CosmosTransaction = TransactionCommon & {
  family: "cosmos" | "osmosis";
  memo: string | null | undefined;
};
//-- END

export type BridgeTransaction = PolkadotTransaction | CosmosTransaction;

export default class Bridge {
  private static instance: Bridge;

  private deviceCommunication: DeviceCommunication

  private constructor(deviceCommunication: DeviceCommunication) {
    this.deviceCommunication = deviceCommunication;
  }

  static buildInstance(deviceCommunication: DeviceCommunication): Bridge {
    if (!Bridge.instance) {
      Bridge.instance = new Bridge(deviceCommunication)
    }

    return Bridge.instance;
  }

  static getInstance() {
    if (!Bridge.instance) {
      throw new Error("Build an instance first");
    }

    return Bridge.instance;
  }

  getCurrencyBridge(currency: CryptoCurrency): CurrencyBridge {
    switch(currency.family) {
      case "polkadot":
        return polkadotBridge.buildCurrencyBridge(this.deviceCommunication);
      default:      
        throw new CurrencyNotSupported(
          "no implementation available for currency " + currency.id,
          {
            currencyName: currency.name,
          }
        );
    }
  }
  
  // getAccountBridge(
  //   account: PolkadotAccount,
  //   parentAccount?: PolkadotAccount | null
  // ): AccountBridge<PolkadotTransaction> {
  //   const mainAccount = getMainAccount(account, parentAccount);
  //   const supportedError = checkAccountSupported(mainAccount);

  //   if (supportedError) {
  //     throw supportedError;
  //   }

  //   return polkadotBridge.buildAccountBridge(this.deviceCommunication);
  // }

  getAccountBridge<T extends TransactionCommon>(
    account: AccountLike,
    parentAccount?: Account | null
  ): AccountBridge<T> {
    const mainAccount = getMainAccount(account, parentAccount);
    const { currency } = mainAccount;
    const { type } = decodeAccountId(mainAccount.id);
    const supportedError = checkAccountSupported(mainAccount);
  
    if (supportedError) {
      throw supportedError;
    }
  
    switch(currency.family) {
      case "polkadot":
        //FIXME, please
        return polkadotBridge.buildAccountBridge(this.deviceCommunication) as AccountBridge<any>;
      default: {
          if (type === "libcore") {
            throw new CurrencyNotSupported(
              "no libcore implementation available for currency " + currency.id,
              {
                currencyName: currency.name,
              }
            );
          } else {
            throw new CurrencyNotSupported("currency not supported " + currency.id, {
              currencyName: mainAccount.currency.name,
            });
          }
        }
      }
  }

  completeFromAccountRaw(raw: AccountRaw, account: Account): Account {
    switch (account.currency.family) {
      case "polkadot": {
        const polkadotResourcesRaw = (raw as PolkadotAccountRaw)
          .polkadotResources;
        if (polkadotResourcesRaw) {
          (account as PolkadotAccount).polkadotResources =
            fromPolkadotResourcesRaw(polkadotResourcesRaw);
        }
        break;
      }
      default:
        throw new CurrencyNotSupported();
    }
  
    return account;
  }
  completeToAccountRaw(raw: AccountRaw, account: Account): AccountRaw {
    switch (account.currency.family) {
      case "polkadot": {
        const polkadotAccount = account as PolkadotAccount;
        if (polkadotAccount.polkadotResources) {
          (raw as PolkadotAccountRaw).polkadotResources = toPolkadotResourcesRaw(
            polkadotAccount.polkadotResources
          );
        }
        break;
      }
      default:
        throw new CurrencyNotSupported();
    }
  
    return raw;
  }

  fromOperationExtraRaw(family: string, extra: Record<string, any>): Record<string, any> {
    switch (family) {
      case "polkadot": 
        return PolkadotAccountFn.fromOperationExtraRaw(extra) ?? extra
      default:
        return extra;
    }
  }
  toOperationExtraRaw(family: string, extra: Record<string, any>): Record<string, any> {
    switch (family) {
      case "polkadot": 
        return PolkadotAccountFn.toOperationExtraRaw(extra) ?? extra
      default:
        return extra;
    }
  }

  getDeviceTransactionConfig(config: {
    account: AccountLike;
    parentAccount: Account | null | undefined;
    transaction: TransactionCommon;
    status: TransactionStatusCommon;
  }): Array<CommonDeviceTransactionField> {
    const mainAccount = getMainAccount(config.account, config.parentAccount);
    switch (mainAccount.currency.family) {
      case "polkadot": {
        const arg = {
          ...config,
          transaction: config.transaction as PolkadotTransaction,
        };
        return polkadotDeviceTransactionCfg(arg)
      }
      default:
        return [];
    }
  }
}
