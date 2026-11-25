import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { accountsSlice } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-network";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type {
  GetReceiveFamilyConfig,
  ReceiveAddressProps,
  ReceiveFamilyConfigPort,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import {
  buildHtmlDisplaySegments,
  type HtmlLinkSegment,
} from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
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

const toIncidentTextPart = (segment: HtmlLinkSegment) =>
  segment.type === "link" ? { text: segment.label, url: segment.href } : { text: segment.content };

const toIncidentTextParts = (html: string | undefined) =>
  html === undefined ? undefined : buildHtmlDisplaySegments(html).map(toIncidentTextPart);

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

type Params = Pick<ReceiveAddressProps, "accountUUID" | "assetId" | "onClose">;

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
  const network = entry
    ? CRYPTO_CURRENCIES_REGISTRY[currencyIdFromNetwork(entry.descriptor.network)]
    : undefined;
  const familyConfig = network ? familyConfigs[network.family] : undefined;
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

  const getFamilyConfig = useMemo<ReceiveFamilyConfigPort | undefined>(
    () => familyConfig && (input => familyConfig({ ...input, featureFlags, legacyAccount })),
    [familyConfig, featureFlags, legacyAccount],
  );
  const onCopyAddress = useCallback((address: string) => copyToClipboard(address), []);
  const onShareAddress = useCallback(async (address: string, cardImageUrl?: string) => {
    // Caught outside leaveAppFor: it must see the failure to release the app lock exemption.
    await leaveAppFor(() => openShareSheet({ message: address, imageUrl: cardImageUrl })).catch(
      () => undefined,
    );
  }, []);

  return {
    accountUUID,
    assetId,
    onClose,
    onCopyAddress,
    onShareAddress,
    VerifyAddressExecutor: VerifyAddressExecutorLWM,
    getFamilyConfig,
    serviceIncidents,
    onOpenUrl: openUrl,
  };
}
