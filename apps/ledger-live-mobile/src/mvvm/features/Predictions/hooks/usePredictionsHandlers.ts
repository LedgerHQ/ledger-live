import { useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  createPredictionsSigner,
  getBindingTypedData,
  handlers as predictionsHandlers,
} from "@features/platform-predictions";
import { useStore } from "~/context/hooks";
import { selectHasSeenIntro, markPredictionsIntroSeen } from "@domain/entity-predictions";
import { usePredictionsSetupHooks, usePredictionsSheetHooks } from "@features/flow-predictions";
import { accountsSelector } from "~/reducers/accounts";
import {
  findPredictionsAccount,
  predictionsSigningRequests,
} from "../signingIntent/signingRequests";

export function usePredictionsHandlers(): WalletAPICustomHandlers {
  const navigation = useNavigation();
  const store = useStore();
  const sheetHooks = usePredictionsSheetHooks();
  const setupHooks = usePredictionsSetupHooks();
  const bindingSigner = useMemo(
    () =>
      createPredictionsSigner({
        requests: predictionsSigningRequests,
        purpose: "binding",
        findAccount: walletAccountId =>
          findPredictionsAccount(accountsSelector(store.getState()), walletAccountId),
        onSigned: setupHooks.startSetup,
        refusal: () => new UserRefusedOnDevice(),
      }),
    [store, setupHooks],
  );

  useEffect(() => bindingSigner.cancelOpened, [bindingSigner]);

  return useMemo<WalletAPICustomHandlers>(
    () =>
      predictionsHandlers({
        uiHooks: {
          ...sheetHooks,
          "app.close": () => navigation.goBack(),
          "intro.isSeen": () => selectHasSeenIntro(store.getState()),
          "intro.markSeen": () => store.dispatch(markPredictionsIntroSeen()),
          "binding.sign": walletAccountId =>
            bindingSigner.sign(walletAccountId, account =>
              getBindingTypedData(account.freshAddress),
            ),
          "binding.reportSetup": setupHooks["binding.reportSetup"],
        },
      }),
    [navigation, sheetHooks, setupHooks, store, bindingSigner],
  );
}
