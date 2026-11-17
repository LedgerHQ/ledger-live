import { useTranslation } from "@shared/i18n";
import type { ReceiveAddressOptionId } from "../logic/toReceiveAddressOptions";
import type { ReceiveNoticeKind } from "../logic/toReceiveNotices";

/** The support questions the help lists, in order. */
export const RECEIVE_HELP_QUESTIONS = ["receiveFromExchange", "receiveSecurely"] as const;

export type ReceiveHelpQuestionId = (typeof RECEIVE_HELP_QUESTIONS)[number];

export type ReceiveAddressCopy = Readonly<{
  title: string;
  networkLabel: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
  selectAddressTitle: string;
  addressOptionLabels: Readonly<Record<ReceiveAddressOptionId, string>>;
  copyLabel: string;
  copiedLabel: string;
  shareLabel: string;
  verifyLabel: string;
  verifyHintMessage: string;
  verifyHintGotIt: string;
  noticeTexts: Readonly<Record<ReceiveNoticeKind, string>>;
  learnMoreLabel: string;
  serviceWarningCta: string;
  serviceStatusTitle: string;
  gotItLabel: string;
  memoTitle: string;
  memoDescription: string;
  helpCardTitle: string;
  helpTitle: string;
  helpQuestions: Readonly<Record<ReceiveHelpQuestionId, string>>;
}>;

/** The labels of the address screen, under the `receiveAddress` namespace. */
export function useReceiveAddressCopy({
  assetTicker,
  networkName,
}: Readonly<{ assetTicker: string; networkName: string }>): ReceiveAddressCopy {
  const { t } = useTranslation();

  return {
    title: t("receiveAddress.title", { asset: assetTicker }),
    networkLabel: t("receiveAddress.networkLabel", { network: networkName }),
    errorTitle: t("receiveAddress.error.title"),
    errorDescription: t("receiveAddress.error.description"),
    retryLabel: t("receiveAddress.error.retry"),
    selectAddressTitle: t("receiveAddress.selectAddress.title"),
    addressOptionLabels: {
      transparent: t("receiveAddress.addressOptions.transparent"),
      shielded: t("receiveAddress.addressOptions.shielded"),
    },
    copyLabel: t("receiveAddress.actions.copy"),
    copiedLabel: t("receiveAddress.actions.copied"),
    shareLabel: t("receiveAddress.actions.share"),
    verifyLabel: t("receiveAddress.actions.verify"),
    verifyHintMessage: t("receiveAddress.verifyHint.message"),
    verifyHintGotIt: t("receiveAddress.verifyHint.gotIt"),
    noticeTexts: {
      utxo: t("receiveAddress.notices.utxo"),
      taproot: t("receiveAddress.notices.taproot"),
      dashStaking: t("receiveAddress.notices.dashStaking"),
      tronInactiveAccount: t("receiveAddress.notices.tronInactiveAccount"),
      tezosDelegation: t("receiveAddress.notices.tezosDelegation"),
      zcashPrivateNotEnabled: t("receiveAddress.notices.zcashPrivateNotEnabled"),
      unverifiableAddress: t("receiveAddress.notices.unverifiableAddress"),
    },
    learnMoreLabel: t("receiveAddress.notices.learnMore"),
    serviceWarningCta: t("receiveAddress.serviceStatus.cta"),
    serviceStatusTitle: t("receiveAddress.serviceStatus.title"),
    gotItLabel: t("receiveAddress.gotIt"),
    memoTitle: t("receiveAddress.memoTag.title"),
    memoDescription: t("receiveAddress.memoTag.description"),
    helpCardTitle: t("receiveAddress.help.cardTitle"),
    helpTitle: t("receiveAddress.help.title"),
    helpQuestions: {
      receiveFromExchange: t("receiveAddress.help.receiveFromExchange"),
      receiveSecurely: t("receiveAddress.help.receiveSecurely"),
    },
  };
}
