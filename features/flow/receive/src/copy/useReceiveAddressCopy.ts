import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  ReceiveAddressOptionRow,
  ReceiveAssetActivationKind,
  ReceiveBlockedReason,
  ReceiveFamilyConfig,
  ReceiveHelpArticle,
  ReceiveMemoType,
  ReceiveNotice,
  ReceiveNoticeId,
  ReceiveServiceIncident,
  ReceiveVerificationMode,
} from "../types";

const NOTICE_APPEARANCE: Readonly<Record<ReceiveNoticeId, ReceiveNotice["appearance"]>> = {
  utxo: "info",
  taproot: "warning",
  dashStaking: "warning",
  tronInactiveAccount: "warning",
  tezosDelegation: "info",
  zcashPrivateNotEnabled: "info",
};

const NO_INCIDENTS: readonly ReceiveServiceIncident[] = [];

type Params = Readonly<{
  assetTicker: string;
  network: string;
  family: ReceiveFamilyConfig;
  verification: ReceiveVerificationMode;
  memoType?: ReceiveMemoType;
  blockedReason?: ReceiveBlockedReason;
  serviceIncidents?: readonly ReceiveServiceIncident[];
  /** The family's activation flow can run from this screen. */
  canActivateAsset?: boolean;
}>;

/** What the legacy receive flow handles that this screen does not, yet. */
const LEGACY_FLOW_REASONS: ReadonlySet<ReceiveBlockedReason> = new Set([
  "readFailed",
  "onboardingRequired",
  "assetActivationRequired",
  "assetActivationUnknown",
]);

const RETRY_REASONS: ReadonlySet<ReceiveBlockedReason> = new Set([
  "readFailed",
  "assetActivationPending",
  "assetActivationUnknown",
]);

const INFO_REASONS: ReadonlySet<ReceiveBlockedReason> = new Set([
  "assetActivationRequired",
  "assetActivationPending",
  "assetActivationUnknown",
]);

function blockedDescriptionKey(
  reason: ReceiveBlockedReason,
  activationKind: ReceiveAssetActivationKind | undefined,
  canActivateAsset: boolean,
) {
  return reason === "assetActivationRequired" && canActivateAsset && activationKind
    ? (`receiveAddress.assetActivation.${activationKind}` as const)
    : (`receiveAddress.blocked.${reason}.description` as const);
}

export function useReceiveAddressCopy({
  assetTicker,
  network,
  family,
  verification,
  memoType,
  blockedReason,
  serviceIncidents = NO_INCIDENTS,
  canActivateAsset = false,
}: Params) {
  const { t } = useTranslation();

  return useMemo(() => {
    const incidents: ReceiveNotice[] = serviceIncidents.map((incident, index) => ({
      id: `incident-${index}`,
      appearance: "warning",
      title: incident.title,
      message: incident.description,
    }));
    const familyNotices: ReceiveNotice[] = family.notices.map(id => ({
      id,
      appearance: NOTICE_APPEARANCE[id],
      message: t(`receiveAddress.notices.${id}`),
    }));

    const articles: ReceiveHelpArticle[] = [
      { id: "receiveFromExchange", label: t("receiveAddress.help.receiveFromExchange") },
      { id: "receiveSecurely", label: t("receiveAddress.help.receiveSecurely") },
    ];

    const addressOptions: ReceiveAddressOptionRow[] = (family.addressOptions ?? []).map(option => ({
      id: option.id,
      label: t(`receiveAddress.addressOptions.${option.id}`),
    }));

    return {
      title: t("receiveAddress.title", { asset: assetTicker }),
      networkLabel: t("receiveAddress.networkLabel", { network }),
      notices: [...incidents, ...familyNotices],
      selectAddressTitle: t("receiveAddress.selectAddress.title"),
      addressOptions,
      blocked: blockedReason
        ? {
            title: t(`receiveAddress.blocked.${blockedReason}.title`, {
              asset: assetTicker,
              network,
            }),
            description: t(
              blockedDescriptionKey(blockedReason, family.activationKind, canActivateAsset),
            ),
            appearance: INFO_REASONS.has(blockedReason) ? ("info" as const) : ("error" as const),
            retryLabel: RETRY_REASONS.has(blockedReason) ? t("receiveAddress.retry") : undefined,
            activateLabel:
              blockedReason === "assetActivationRequired" && canActivateAsset
                ? t("receiveAddress.assetActivation.activate")
                : undefined,
            // The family flow replaces the legacy hand-over: both would run the same activation.
            legacyFlowLabel:
              LEGACY_FLOW_REASONS.has(blockedReason) &&
              !(blockedReason === "assetActivationRequired" && canActivateAsset)
                ? t("receiveAddress.useLegacyFlow")
                : undefined,
          }
        : undefined,
      memoTag: memoType
        ? {
            cardTitle: t("receiveAddress.memoTag.cardTitle"),
            title: t("receiveAddress.memoTag.title"),
            description: t("receiveAddress.memoTag.description"),
            learnMoreLabel: t("receiveAddress.memoTag.learnMore"),
            gotItLabel: t("receiveAddress.memoTag.gotIt"),
          }
        : undefined,
      verificationUnavailableMessage:
        verification === "unavailable" ? t("receiveAddress.verificationUnavailable") : undefined,
      help: {
        cardTitle: t("receiveAddress.help.cardTitle"),
        title: t("receiveAddress.help.title"),
        articles,
      },
    };
  }, [
    t,
    assetTicker,
    network,
    family,
    verification,
    memoType,
    blockedReason,
    serviceIncidents,
    canActivateAsset,
  ]);
}
