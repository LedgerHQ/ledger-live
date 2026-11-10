import { useNavigation } from "@react-navigation/native";
import { createIntent } from "@features/platform-device-intent";
import type {
  RemoveMemberIntent,
  RemoveMemberIntentInput,
} from "@features/platform-intent-wallet-sync";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import type { Trustchain, TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "~/context/hooks";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { removeMemberIntentLWMDefinition } from "../../deviceIntents/removeMemberIntent/intentLWMDefinition";
import { useCreateSessionSdk } from "../../deviceIntents/useCreateSessionSdk";
import { useLedgerSyncIntentStep } from "../../deviceIntents/useLedgerSyncIntentStep";

/** The remove member step on DIE, with the outcomes of `useRemoveMember`. */
export function useManageInstancesDeviceIntentStepViewModel(member: TrustchainMember) {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const createSessionSdk = useCreateSessionSdk();

  const step = useLedgerSyncIntentStep<RemoveMemberIntent>({
    buildIntent: () => {
      if (!trustchain || !memberCredentials) {
        throw new TrustchainEjected("trustchain or memberCredentials is not set");
      }
      const input: RemoveMemberIntentInput = {
        trustchain,
        memberCredentials,
        member,
        createSessionSdk,
      };
      return createIntent(removeMemberIntentLWMDefinition, input, { onResult });
    },
  });

  function onResult(newTrustchain: Trustchain) {
    dispatch(setTrustchain(newTrustchain));
    step.finish();
    navigation.navigate(ScreenName.WalletSyncManageInstancesSuccess, { member });
  }

  return step;
}
