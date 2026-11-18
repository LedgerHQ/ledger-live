import { useCallback, useMemo } from "react";
import { accountsSlice } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import {
  closeReceiveAddressDialog,
  toReceiveServiceIncidents,
  type ReceiveAddressProps,
  type ReceiveAddressDialogTarget,
  type ReceiveFamilyConfigPort,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";
import { useLLDCoinFamily } from "~/renderer/families";
import type { State } from "~/renderer/reducers";
import { openURL } from "~/renderer/linking";
import { accountSelector } from "~/renderer/reducers/accounts";
import { useSanctionSimulation } from "../../hooks/useSanctionSimulation";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";

const simulateSanctionedAddress = async () => true;

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** What only the desktop app gives the receive address screen. */
export function useReceiveAddressDialogViewModel({
  accountUUID,
  assetId,
  source,
}: ReceiveAddressDialogTarget): ReceiveAddressProps {
  const dispatch = useDispatch();
  const onClose = useCallback(() => dispatch(closeReceiveAddressDialog()), [dispatch]);
  const onCopyAddress = useCopyToClipboard();

  const entry = useSelector(state => selectAccountEntry(state, accountUUID));
  const legacyAccount = useSelector(state =>
    entry?.legacyId ? accountSelector(state, { accountId: entry.legacyId }) : undefined,
  );
  const network = entry
    ? CRYPTO_CURRENCIES_REGISTRY[currencyIdFromNetwork(entry.descriptor.network)]
    : undefined;
  const { receiveAddressConfig } = useLLDCoinFamily(network?.family);
  const { incidents } = useFilteredServiceStatus({
    tickers: network ? [network.ticker] : [],
    entryPoint: "flow",
  });
  const serviceIncidents = useMemo(() => toReceiveServiceIncidents(incidents), [incidents]);
  const { isSimulated: isSanctionSimulated } = useSanctionSimulation();
  const checkAddressSanctioned = useMemo(() => {
    if (isSanctionSimulated) return simulateSanctionedAddress;
    return network && ((address: string) => isAddressSanctioned(network, address));
  }, [isSanctionSimulated, network]);
  const featureFlags = useFeatureFlags();

  const getFamilyConfig = useMemo<ReceiveFamilyConfigPort | undefined>(
    () =>
      receiveAddressConfig &&
      (input => receiveAddressConfig({ ...input, featureFlags, legacyAccount })),
    [receiveAddressConfig, featureFlags, legacyAccount],
  );

  return {
    accountUUID,
    assetId,
    source,
    onClose,
    onCopyAddress,
    VerifyAddressExecutor: VerifyAddressExecutorLWD,
    getFamilyConfig,
    serviceIncidents,
    checkAddressSanctioned,
    onOpenUrl: openURL,
  };
}
