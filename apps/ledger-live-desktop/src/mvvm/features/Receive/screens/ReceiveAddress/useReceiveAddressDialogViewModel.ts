import { useCallback, useMemo } from "react";
import { accountsSlice } from "@domain/entity-account";
import {
  buildHtmlDisplaySegments,
  type HtmlLinkSegment,
} from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import {
  closeReceiveAddressDialog,
  type ReceiveAddressProps,
  type ReceiveAddressDialogTarget,
  type ReceiveFamilyConfigPort,
  useReceiveNetwork,
} from "@features/flow-receive";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";
import { useLLDCoinFamily } from "~/renderer/families";
import type { State } from "~/renderer/reducers";
import { accountSelector } from "~/renderer/reducers/accounts";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";

const toIncidentTextPart = (segment: HtmlLinkSegment) =>
  segment.type === "link" ? { text: segment.label, url: segment.href } : { text: segment.content };

const toIncidentTextParts = (html: string | undefined) =>
  html === undefined ? undefined : buildHtmlDisplaySegments(html).map(toIncidentTextPart);

const { selectAccountLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

/** What only the desktop app gives the receive address screen. */
export function useReceiveAddressDialogViewModel({
  accountUUID,
  assetId,
}: ReceiveAddressDialogTarget): ReceiveAddressProps {
  const dispatch = useDispatch();
  const onClose = useCallback(() => dispatch(closeReceiveAddressDialog()), [dispatch]);
  const onCopyAddress = useCopyToClipboard();

  const legacyId = useSelector(state => selectAccountLegacyId(state, accountUUID));
  const legacyAccount = useSelector(state =>
    legacyId ? accountSelector(state, { accountId: legacyId }) : undefined,
  );
  const { asset, network } = useReceiveNetwork(assetId);
  const token = asset?.type === "TokenCurrency" ? asset : undefined;
  const { receiveAddressConfig, receiveGateAction } = useLLDCoinFamily(network?.family);
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
  const featureFlags = useFeatureFlags();

  const getFamilyConfig = useMemo<ReceiveFamilyConfigPort | undefined>(
    () =>
      receiveAddressConfig &&
      (input => receiveAddressConfig({ ...input, featureFlags, legacyAccount })),
    [receiveAddressConfig, featureFlags, legacyAccount],
  );

  const onResolveGate = useMemo(
    () =>
      receiveGateAction && legacyAccount
        ? () => {
            onClose();
            receiveGateAction({ account: legacyAccount, token, dispatch });
          }
        : undefined,
    [receiveGateAction, legacyAccount, onClose, token, dispatch],
  );

  return {
    accountUUID,
    assetId,
    onClose,
    onCopyAddress,
    VerifyAddressExecutor: VerifyAddressExecutorLWD,
    getFamilyConfig,
    serviceIncidents,
    onResolveGate,
    checkAddressSanctioned,
  };
}
