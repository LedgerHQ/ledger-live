import { useCallback, useEffect, useMemo, useRef } from "react";
import { accountsSlice } from "@domain/entity-account";
import {
  useReceiveNetwork,
  type GetReceiveFamilyConfig,
  type ReceiveAddressProps,
  type ReceiveFamilyConfigPort,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { useNavigation, type ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  buildHtmlDisplaySegments,
  type HtmlLinkSegment,
} from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import type { Account } from "@ledgerhq/types-live";
import { copyToClipboard } from "@shared/clipboard";
import { openShareSheet } from "@shared/share-sheet";
import { useSelector } from "~/context/hooks";
import receiveAddressConfigs from "~/generated/ReceiveAddressConfig";
import receiveGateActions from "~/generated/ReceiveGateAction";
import { accountSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";
import { VerifyAddressExecutorLWM } from "../../verifyAddressIntent/VerifyAddressExecutorLWM";

// Each family's config reads its own account type; the screen gives it the account of its family.
const familyConfigs = receiveAddressConfigs as Partial<
  Record<string, GetReceiveFamilyConfig<Account>>
>;

type ReceiveGateAction = (typeof receiveGateActions)[keyof typeof receiveGateActions];
const gateActions: Partial<Record<string, ReceiveGateAction>> = receiveGateActions;

const toIncidentTextPart = (segment: HtmlLinkSegment) =>
  segment.type === "link" ? { text: segment.label, url: segment.href } : { text: segment.content };

const toIncidentTextParts = (html: string | undefined) =>
  html === undefined ? undefined : buildHtmlDisplaySegments(html).map(toIncidentTextPart);

const { selectAccountLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

type Params = Pick<ReceiveAddressProps, "accountUUID" | "assetId" | "onClose">;

export function useReceiveAddressScreenViewModel({
  accountUUID,
  assetId,
  onClose,
}: Params): ReceiveAddressProps {
  const legacyId = useSelector(state => selectAccountLegacyId(state, accountUUID));
  const legacyAccount = useSelector(state =>
    legacyId ? accountSelector(state, { accountId: legacyId }) : undefined,
  );
  const featureFlags = useFeatureFlags();
  const { asset, network } = useReceiveNetwork(assetId);
  const token = asset?.type === "TokenCurrency" ? asset : undefined;
  const familyConfig = network ? familyConfigs[network.family] : undefined;
  const gateAction = network ? gateActions[network.family] : undefined;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
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

  const accountCurrency = legacyAccount?.currency;
  const checkAddressSanctioned = useMemo(
    () => accountCurrency && ((address: string) => isAddressSanctioned(accountCurrency, address)),
    [accountCurrency],
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

  // Stops waiting for the return from the family flow: set while it is open.
  const stopWaitingForReturn = useRef<() => void>(undefined);
  useEffect(() => () => stopWaitingForReturn.current?.(), []);

  const onResolveGate = useMemo(
    () =>
      gateAction && legacyAccount
        ? (refreshGate: () => void) => {
            if (stopWaitingForReturn.current) return;
            const stop = navigation.addListener("focus", () => {
              stop();
              stopWaitingForReturn.current = undefined;
              refreshGate();
            });
            stopWaitingForReturn.current = stop;
            gateAction({ navigation, account: legacyAccount, token });
          }
        : undefined,
    [gateAction, legacyAccount, token, navigation],
  );

  return {
    accountUUID,
    assetId,
    onClose,
    onCopyAddress,
    onShareAddress,
    VerifyAddressExecutor: VerifyAddressExecutorLWM,
    getFamilyConfig,
    serviceIncidents,
    onResolveGate,
    checkAddressSanctioned,
  };
}
