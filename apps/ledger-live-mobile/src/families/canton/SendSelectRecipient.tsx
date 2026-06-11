import {
  TooManyUtxosCritical,
  TooManyUtxosWarning,
  TopologyChangeError,
} from "@ledgerhq/coin-canton";
import { CantonAccount, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { isCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@features/platform-feature-flags";
import { sendRecipientCanNext } from "@ledgerhq/live-common/families/hedera/utils";
import { urls } from "~/utils/urls";
import Alert from "~/components/Alert";
import type { Account } from "@ledgerhq/types-live";
import React, { useEffect, useState, useCallback } from "react";
import { Trans } from "~/context/Locale";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { createNavigationSnapshot, type ScreenRoute } from "./utils/navigationSnapshot";
import { component as TooManyUtxosModal } from "./TooManyUtxosModal";
import CantonReonboardDrawer from "./Onboard/CantonReonboardDrawer";

function StepRecipientCustomAlert({
  status,
  account,
}: Readonly<{
  status: TransactionStatus;
  account?: Account;
}>) {
  const cantonAccount = account as CantonAccount;
  const [showTooManyUtxosModal, setShowTooManyUtxosModal] = useState(false);
  const [showReonboardDrawer, setShowReonboardDrawer] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute<ScreenRoute>();
  const llmModularDrawer = useFeature("llmModularDrawer");

  const tooManyUtxosCritical = status?.warnings?.tooManyUtxos instanceof TooManyUtxosCritical;
  const tooManyUtxosWarning = status?.warnings?.tooManyUtxos instanceof TooManyUtxosWarning;
  const topologyChangeError = status?.errors?.topologyChange instanceof TopologyChangeError;

  const redirectToReonboarding = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, null);
    const restoreState = createNavigationSnapshot(route);

    if (llmModularDrawer?.enabled) {
      setShowReonboardDrawer(true);
    } else {
      navigation.navigate(NavigatorName.CantonOnboard, {
        screen: ScreenName.CantonOnboardAccount,
        params: {
          accountsToAdd: [],
          currency: mainAccount.currency,
          isReonboarding: true,
          accountToReonboard: mainAccount,
          restoreState,
        },
      });
    }
  }, [account, navigation, route, llmModularDrawer]);

  useEffect(() => {
    if (tooManyUtxosCritical) {
      setShowTooManyUtxosModal(true);
    }
  }, [tooManyUtxosCritical]);

  useEffect(() => {
    if (topologyChangeError) {
      redirectToReonboarding();
    }
  }, [topologyChangeError, redirectToReonboarding]);

  const handleCloseModal = () => {
    setShowTooManyUtxosModal(false);
  };

  const mainAccount = account ? getMainAccount(account, null) : null;
  const currency =
    mainAccount && isCryptoCurrency(mainAccount.currency) ? mainAccount.currency : undefined;

  return (
    <>
      {tooManyUtxosWarning && (
        <Alert type="warning" learnMoreUrl={urls.canton.learnMore} learnMoreKey="common.learnMore">
          <Trans i18nKey="canton.tooManyUtxos.warning" />
        </Alert>
      )}

      {account && (
        <TooManyUtxosModal
          isOpened={showTooManyUtxosModal}
          onClose={handleCloseModal}
          account={cantonAccount}
        />
      )}

      {currency && mainAccount && (
        <CantonReonboardDrawer
          isOpen={showReonboardDrawer}
          currency={currency}
          accountToReonboard={mainAccount}
          restoreState={createNavigationSnapshot(route)}
          onClose={() => setShowReonboardDrawer(false)}
        />
      )}
    </>
  );
}

export default { sendRecipientCanNext, StepRecipientCustomAlert };
