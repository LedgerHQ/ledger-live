import { useCallback, useMemo } from "react";
import { featureIntroPageName, trackButtonClicked } from "@features/platform-pay-analytics";
import { useTranslation } from "@shared/i18n";
import type {
  BankTransferHandoff,
  BankTransferIntroProps,
  BankTransferIntroRowIcon,
  BankTransferIntroViewModel,
} from "../../types";

export const BANK_TRANSFER_INTRO_FLOW = "Cash to stable";
export const BANK_TRANSFER_INTRO_PAGE = featureIntroPageName(BANK_TRANSFER_INTRO_FLOW);

const KEY_PREFIX = "payTab.bankTransferIntro";

const ROWS: readonly { icon: BankTransferIntroRowIcon; key: string }[] = [
  { icon: "Bank", key: "bank" },
  { icon: "Coins", key: "fees" },
  { icon: "Chart5", key: "earn" },
];

const TRACK_BUTTON = {
  createAccount: "create an account",
  logIn: "log in to noah",
  close: "close",
} as const;

export function useBankTransferIntroViewModel({
  isOpen,
  heroImage,
  onBankTransfer,
  onClose,
}: BankTransferIntroProps): BankTransferIntroViewModel {
  const { t } = useTranslation();

  const trackCta = useCallback((button: (typeof TRACK_BUTTON)[keyof typeof TRACK_BUTTON]) => {
    trackButtonClicked({
      button,
      flow: BANK_TRANSFER_INTRO_FLOW,
      page: BANK_TRANSFER_INTRO_PAGE,
    });
  }, []);

  const handOffToPartner = useCallback(
    (button: (typeof TRACK_BUTTON)[keyof typeof TRACK_BUTTON], handoff: BankTransferHandoff) => {
      trackCta(button);
      onBankTransfer(handoff);
      onClose();
    },
    [trackCta, onBankTransfer, onClose],
  );

  const onCreateAccountPress = useCallback(() => {
    handOffToPartner(TRACK_BUTTON.createAccount, "createAccount");
  }, [handOffToPartner]);

  const onLogInPress = useCallback(() => {
    handOffToPartner(TRACK_BUTTON.logIn, "logIn");
  }, [handOffToPartner]);

  const onClosePress = useCallback(() => {
    trackCta(TRACK_BUTTON.close);
    onClose();
  }, [trackCta, onClose]);

  const onDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const rows = useMemo(
    () =>
      ROWS.map(({ icon, key }) => ({
        icon,
        title: t(`${KEY_PREFIX}.rows.${key}.title`),
        description: t(`${KEY_PREFIX}.rows.${key}.description`),
      })),
    [t],
  );

  return {
    isOpen,
    title: t(`${KEY_PREFIX}.title`),
    description: t(`${KEY_PREFIX}.description`),
    createAccountLabel: t(`${KEY_PREFIX}.createAccount`),
    logInLabel: t(`${KEY_PREFIX}.logIn`),
    providedBy: t(`${KEY_PREFIX}.providedBy`),
    heroImage,
    rows,
    onCreateAccountPress,
    onLogInPress,
    onClosePress,
    onDismiss,
  };
}
