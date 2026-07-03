/**
 * @module models/account
 */
import BigNumber from "bignumber.js";
import { createDataModel, DataModel } from "@ledgerhq/live-common/DataModel";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/index";
import { Account, AccountRaw, Operation, AccountUserData } from "@ledgerhq/types-live";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/store";

const APTOS_NON_HARDENED_DERIVATION_PATH_REGEX = /^44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

/**
 * @memberof models/account
 */
export const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.getTime() < 1000 * 60 * 60 * 24 * maxDaysOld;

const opRetentionFilter = opRetentionStategy(366, 500);

const accountModel: DataModel<AccountRaw, [Account, AccountUserData]> = createDataModel({
  migrations: [
    // 2018-10-10: change of the account id format to include the derivationMode and seedIdentifier in Account
    raw => {
      raw = {
        ...raw,
      };
      const { currencyId, freshAddressPath } = raw;
      const [type, originalVersion, xpubOrAddress, walletName] = raw.id.split(":");
      let version = originalVersion;
      let derivationMode;
      let seedIdentifier;
      switch (type) {
        case "libcore": {
          const i = walletName.indexOf("__") + currencyId.length + 1;
          derivationMode = walletName.slice(i + 2);
          seedIdentifier = walletName.slice(0, i);
          break;
        }
        case "ethereumjs": {
          // reverse the derivation that was used to infer what was the derivationMode
          if (freshAddressPath.match(/^44'\/60'\/0'\/[0-9]+$/)) {
            derivationMode = "ethM";
          } else if (
            currencyId === "ethereum_classic" &&
            freshAddressPath.match(/^44'\/60'\/160720'\/0'\/[0-9]+$/)
          ) {
            derivationMode = "etcM";
          } else {
            derivationMode = "";
          }
          delete raw.xpub;
          seedIdentifier = xpubOrAddress;
          version = "2"; // replace version because no need to have the currencyId like used to do.
          break;
        }
        case "ripplejs": {
          // reverse the derivation that was used to infer what was the derivationMode
          if (freshAddressPath.match(/^44'\/144'\/0'\/[0-9]+'$/)) {
            derivationMode = "rip";
          } else {
            derivationMode = "";
          }
          delete raw.xpub;
          seedIdentifier = xpubOrAddress;
          version = "2"; // replace version because no need to have the currencyId like used to do.
          break;
        }
        default:
          // this case should never happen
          throw new Error(`unknown Account type=${type}`);
      }
      const id = `${type}:${version}:${currencyId}:${xpubOrAddress}:${derivationMode}`;
      return {
        ...raw,
        id,
        derivationMode,
        seedIdentifier,
      };
    },
    // Set 'change' and 'address_index' levels to be hardened for Aptos derivation path
    raw => {
      const { currencyId, freshAddressPath } = raw;
      if (
        currencyId === "aptos" &&
        freshAddressPath.match(APTOS_NON_HARDENED_DERIVATION_PATH_REGEX)
      ) {
        return {
          ...raw,
          freshAddressPath: freshAddressPath
            .split("/")
            .map((value: string) => (value.endsWith("'") ? value : value + "'"))
            .join("/"),
        };
      }
      return raw;
    },
    // Initialize cosmosResources for crypto_org accounts missing it
    raw => {
      const { currencyId } = raw;
      if (currencyId === "crypto_org" && !raw.cosmosResources) {
        return {
          ...raw,
          cosmosResources: {
            delegations: [],
            redelegations: [],
            unbondings: [],
            delegatedBalance: new BigNumber(0),
            pendingRewardsBalance: new BigNumber(0),
            unbondingBalance: new BigNumber(0),
            withdrawAddress: raw.freshAddress,
            sequence: 0,
          },
        };
      }
      return raw;
    },
    // ^- Each time a modification is brought to the model, add here a migration function here
  ],

  decode: async (raw: AccountRaw) => [await fromAccountRaw(raw), accountRawToAccountUserData(raw)],
  encode: async ([account, userData]: [Account, AccountUserData]): Promise<AccountRaw> =>
    toAccountRaw(
      {
        ...account,
        operations: account.operations.filter(opRetentionFilter),
      },
      userData,
    ),
});

export default accountModel;
