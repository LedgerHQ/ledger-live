import { useCallback, useMemo, useRef } from "react";
import type { View } from "react-native";
import { accountsSlice } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type {
  GetReceiveFamilyConfig,
  ReceiveAddressProps,
  ReceiveFamilyConfigPort,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import type { Account } from "@ledgerhq/types-live";
import { copyToClipboard } from "@shared/clipboard";
import { openShareSheet } from "@shared/share-sheet";
import { useSelector } from "~/context/hooks";
import receiveAddressConfigs from "~/generated/ReceiveAddressConfig";
import { accountSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";
import { VerifyAddressExecutorLWM } from "../../verifyAddressIntent/VerifyAddressExecutorLWM";

// Each family's config reads its own account type; the screen gives it the account of its family.
const familyConfigs = receiveAddressConfigs as Partial<
  Record<string, GetReceiveFamilyConfig<Account>>
>;

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

type Params = Pick<ReceiveAddressProps, "accountUUID" | "assetId" | "onClose">;

/** What only the mobile app gives the receive address screen. */
export function useReceiveAddressScreenViewModel({
  accountUUID,
  assetId,
  onClose,
}: Params): ReceiveAddressProps {
  const entry = useSelector(state => selectAccountEntry(state, accountUUID));
  const legacyAccount = useSelector(state =>
    entry?.legacyId ? accountSelector(state, { accountId: entry.legacyId }) : undefined,
  );
  const featureFlags = useFeatureFlags();
  const family = entry
    ? CRYPTO_CURRENCIES_REGISTRY[currencyIdFromNetwork(entry.descriptor.network)]?.family
    : undefined;
  const familyConfig = family ? familyConfigs[family] : undefined;

  const getFamilyConfig = useMemo<ReceiveFamilyConfigPort | undefined>(
    () => familyConfig && (input => familyConfig({ ...input, featureFlags, legacyAccount })),
    [familyConfig, featureFlags, legacyAccount],
  );
  const onCopyAddress = useCallback((address: string) => copyToClipboard(address), []);
  const cardRef = useRef<View>(null);
  const onShareAddress = useCallback(async (address: string) => {
    // Caught outside leaveAppFor: it must see the failure to release the app lock exemption.
    await leaveAppFor(() => openShareSheet({ message: address, capture: cardRef })).catch(
      () => undefined,
    );
  }, []);

  return {
    accountUUID,
    assetId,
    onClose,
    onCopyAddress,
    onShareAddress,
    cardRef,
    VerifyAddressExecutor: VerifyAddressExecutorLWM,
    getFamilyConfig,
  };
}
