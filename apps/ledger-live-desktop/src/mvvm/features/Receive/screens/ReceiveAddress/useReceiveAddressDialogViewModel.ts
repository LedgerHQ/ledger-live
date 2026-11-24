import { useCallback, useMemo } from "react";
import { accountsSlice } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { buildHtmlDisplaySegments } from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import {
  closeReceiveAddressDialog,
  type ReceiveAddressProps,
  type ReceiveAddressDialogTarget,
  type ReceiveFamilyConfigPort,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";
import { useLLDCoinFamily } from "~/renderer/families";
import { openURL } from "~/renderer/linking";
import type { State } from "~/renderer/reducers";
import { accountSelector } from "~/renderer/reducers/accounts";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";

const toIncidentTextParts = (html: string | undefined) =>
  html === undefined
    ? undefined
    : buildHtmlDisplaySegments(html).map(segment =>
        segment.type === "link"
          ? { text: segment.label, url: segment.href }
          : { text: segment.content },
      );

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** What only the desktop app gives the receive address screen. */
export function useReceiveAddressDialogViewModel({
  accountUUID,
  assetId,
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
  const serviceIncidents = useMemo(
    () =>
      incidents.map(incident => ({
        title: incident.name,
        description: toIncidentTextParts(incident.incident_updates?.[0]?.body),
      })),
    [incidents],
  );
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
    onClose,
    onCopyAddress,
    VerifyAddressExecutor: VerifyAddressExecutorLWD,
    getFamilyConfig,
    serviceIncidents,
    onOpenUrl: openURL,
  };
}
