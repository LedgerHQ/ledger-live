import { useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useBankTransferIntroAdapter,
  type BankTransferHandoff,
  type BankTransferIntroLabels,
  type BankTransferIntroProps,
} from "@features/flow-pay-bank-transfer";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useTranslation } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenBuySell } from "LLM/features/Buy";

const DEPOSIT_PAGE = "Pay";
const FIAT_PROVIDER_MANIFEST_ID = "noah";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Re.pack FastImage source must be required from the app.
const BANK_TRANSFER_INTRO_HERO_IMAGE = require("../assets/bank-transfer-intro-hero.webp");

const DEPOSIT_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabDepositOptions = UseDepositOptionsAdapter & {
  bankTransferIntro: BankTransferIntroProps;
};

export function usePayTabDepositOptions(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabDepositOptions {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { bottom } = useSafeAreaInsets();
  const bottomInset = Platform.OS === "ios" ? bottom : 0;

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    categories: DEPOSIT_CATEGORIES,
    sourceScreenName: DEPOSIT_PAGE,
    fromMenu: true,
  });
  const { handleOpenSwap } = useOpenSwap({ sourceScreenName: DEPOSIT_PAGE });
  const { handleOpenBuySell } = useOpenBuySell({ sourceScreenName: DEPOSIT_PAGE });

  const onBankTransfer = useCallback(
    (handoff: BankTransferHandoff) => {
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveProvider,
        params: {
          manifestId: FIAT_PROVIDER_MANIFEST_ID,
          fromMenu: true,
          noahAuth: handoff,
        },
      });
    },
    [navigation],
  );

  const introLabels: BankTransferIntroLabels = {
    title: t("payTab.bankTransferIntro.title"),
    description: t("payTab.bankTransferIntro.description"),
    createAccountLabel: t("payTab.bankTransferIntro.createAccount"),
    logInLabel: t("payTab.bankTransferIntro.logIn"),
    providedBy: t("payTab.bankTransferIntro.providedBy"),
    rows: [
      {
        icon: "Bank",
        title: t("payTab.bankTransferIntro.rows.bank.title"),
        description: t("payTab.bankTransferIntro.rows.bank.description"),
      },
      {
        icon: "Coins",
        title: t("payTab.bankTransferIntro.rows.fees.title"),
        description: t("payTab.bankTransferIntro.rows.fees.description"),
      },
      {
        icon: "Chart5",
        title: t("payTab.bankTransferIntro.rows.earn.title"),
        description: t("payTab.bankTransferIntro.rows.earn.description"),
      },
    ],
  };

  const { open: openBankTransferIntro, bankTransferIntro } = useBankTransferIntroAdapter({
    labels: introLabels,
    heroImage: BANK_TRANSFER_INTRO_HERO_IMAGE,
    bottomInset,
    onBankTransfer,
    onTrackEvent,
  });

  const onSelect = useCallback(
    (id: DepositOptionId) => {
      switch (id) {
        case "bankTransfer":
          openBankTransferIntro();
          break;
        case "swap":
          handleOpenSwap();
          break;
        case "buy":
          handleOpenBuySell("buy");
          break;
        case "receive":
          handleOpenReceiveDrawer();
          break;
      }
    },
    [openBankTransferIntro, handleOpenSwap, handleOpenBuySell, handleOpenReceiveDrawer],
  );

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
    onTrackEvent,
  });

  return { open, depositOptions: { ...depositOptions, bottomInset: bottom }, bankTransferIntro };
}
