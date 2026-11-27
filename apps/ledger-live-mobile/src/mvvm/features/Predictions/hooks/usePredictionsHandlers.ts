import { useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  createPredictionsSigner,
  getBindingTypedData,
  isSellPosition,
  handlers as predictionsHandlers,
} from "@features/platform-predictions";
import { useStore } from "~/context/hooks";
import { selectHasSeenIntro, markPredictionsIntroSeen } from "@domain/entity-predictions";
import {
  usePredictionsOrderHooks,
  usePredictionsSetupHooks,
  usePredictionsSheetHooks,
} from "@features/flow-predictions";
import { accountsSelector } from "~/reducers/accounts";
import {
  findPredictionsAccount,
  predictionsSigningRequests,
} from "../signingIntent/signingRequests";
import { useOpenPredictionsOrderResult } from "./useOpenPredictionsOrderResult";

export function usePredictionsHandlers(): WalletAPICustomHandlers {
  const navigation = useNavigation();
  const store = useStore();
  const sheetHooks = usePredictionsSheetHooks();
  const setupHooks = usePredictionsSetupHooks();
  const orderHooks = usePredictionsOrderHooks();
  const bindingSigner = useMemo(
    () =>
      createPredictionsSigner({
        requests: predictionsSigningRequests,
        purpose: "binding",
        findAccount: walletAccountId =>
          findPredictionsAccount(accountsSelector(store.getState()), walletAccountId),
        onSigned: setupHooks.startSetup,
        addressOf: account => account.freshAddress,
        refusal: () => new UserRefusedOnDevice(),
      }),
    [store, setupHooks],
  );
  const orderSigner = useMemo(
    () =>
      createPredictionsSigner({
        requests: predictionsSigningRequests,
        purpose: "order",
        findAccount: walletAccountId =>
          findPredictionsAccount(accountsSelector(store.getState()), walletAccountId),
        addressOf: account => account.freshAddress,
        refusal: () => new UserRefusedOnDevice(),
      }),
    [store],
  );
  const saleSigner = useMemo(
    () =>
      createPredictionsSigner({
        requests: predictionsSigningRequests,
        purpose: "sale",
        findAccount: walletAccountId =>
          findPredictionsAccount(accountsSelector(store.getState()), walletAccountId),
        addressOf: account => account.freshAddress,
        refusal: () => new UserRefusedOnDevice(),
      }),
    [store],
  );

  useOpenPredictionsOrderResult(orderHooks.ownsOrder);
  useEffect(() => bindingSigner.cancelOpened, [bindingSigner]);
  useEffect(() => orderSigner.cancelOpened, [orderSigner]);
  useEffect(() => saleSigner.cancelOpened, [saleSigner]);

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
          "order.sign": async (walletAccountId, typedData, display) => {
            const signer = isSellPosition(typedData) ? saleSigner : orderSigner;
            const { signature } = await signer.sign(walletAccountId, () => typedData);
            return { signature, walletOrderId: orderHooks.startOrder(typedData, display) };
          },
          "order.report": orderHooks["order.report"],
        },
      }),
    [navigation, sheetHooks, setupHooks, orderHooks, store, bindingSigner, orderSigner, saleSigner],
  );
}
