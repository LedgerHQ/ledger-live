import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { selectAccountAssetStakingTotals } from "@domain/entity-account-staking";
import { useAccountData } from "@features/platform-account-data";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useLegacyAccountDescriptor } from "~/renderer/hooks/useLegacyAccountDescriptor";

/** The `staking` totals of the native coin of a legacy account, read while mounted; `undefined` until read. */
export function useStakingTotals(account: Account) {
  const { accountUUID, descriptor } = useLegacyAccountDescriptor(account.id);
  useAccountData("staking", descriptor);
  return useSelector(state => {
    const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(account.currency.id);
    return accountUUID && assetId.success
      ? selectAccountAssetStakingTotals(state, accountUUID, assetId.data)
      : undefined;
  });
}
