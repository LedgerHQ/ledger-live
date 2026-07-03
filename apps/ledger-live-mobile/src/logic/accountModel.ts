import BigNumber from "bignumber.js";
import { createDataModel } from "@ledgerhq/live-common/DataModel";
import type { DataModel } from "@ledgerhq/live-common/DataModel";
import type { Account, AccountRaw, Operation, AccountUserData } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/index";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/store";
const APTOS_NON_HARDENED_DERIVATION_PATH_REGEX = /^44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

/**
 * @memberof models/account
 */
export const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.valueOf() < 1000 * 60 * 60 * 24 * maxDaysOld;

const opRetentionFilter = opRetentionStategy(366, 500);

const accountModel: DataModel<AccountRaw, [Account, AccountUserData]> = createDataModel({
  migrations: [
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
