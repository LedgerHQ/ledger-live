import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useBankTransferIntroAdapter,
  type BankTransferHandoff,
  type BankTransferIntroProps,
} from "@features/flow-pay-bank-transfer";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenBuySell } from "LLM/features/Buy";

const DEPOSIT_PAGE = "Pay";
const FIAT_PROVIDER_MANIFEST_ID = "noah";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Re.pack FastImage source must be required from the app.
const BANK_TRANSFER_INTRO_HERO_IMAGE = require("../assets/bank-transfer-intro-hero.webp");

export type UsePayTabDepositOptions = UseDepositOptionsAdapter & {
  bankTransferIntro: BankTransferIntroProps;
};

export function usePayTabDepositOptions(onCryptoAddress: () => void): UsePayTabDepositOptions {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

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

  const { open: openBankTransferIntro, bankTransferIntro } = useBankTransferIntroAdapter({
    heroImage: BANK_TRANSFER_INTRO_HERO_IMAGE,
    onBankTransfer,
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
          onCryptoAddress();
          break;
      }
    },
    [openBankTransferIntro, handleOpenSwap, handleOpenBuySell, onCryptoAddress],
  );

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
  });

  return { open, depositOptions, bankTransferIntro };
}
