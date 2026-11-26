import { useNavigation } from "@react-navigation/native";
import {
  buildRemoveMemberIntentInput,
  useLedgerSyncResultAcceptance,
} from "@features/platform-ledger-sync";
import { createIntent } from "@features/platform-device-intent";
import {
  assertKeyRingMember,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingSession,
  type KeyRingTreeUpdate,
  type RemoveMemberIntent,
} from "@features/platform-key-ring";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { removeMemberIntentLWMDefinition } from "../../deviceIntents/removeMemberIntent/intentLWMDefinition";
import { useKeyRingClient } from "../../hooks/useKeyRingClient";
import {
  type LedgerSyncStepNavigation,
  useLedgerSyncIntentStep,
} from "../../deviceIntents/useLedgerSyncIntentStep";

export type RemoveInstanceStepInput = Readonly<{ member: KeyRingMember }>;

type Props = Readonly<{ input: RemoveInstanceStepInput; onClose: () => void }>;

/** The remove member step on DIE, with the outcomes of `useRemoveMember`. */
export function useManageInstancesDeviceIntentStepViewModel({ input, onClose }: Props) {
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const session = useSelector(selectKeyRingSession);
  const client = useKeyRingClient();

  const { resultRef: removedMemberRef, accept } = useLedgerSyncResultAcceptance<KeyRingMember>();

  const step = useLedgerSyncIntentStep<RemoveMemberIntent, RemoveInstanceStepInput>({
    input,
    onClose,
    buildIntent: ({ member }) => {
      assertKeyRingMember(session);
      const intentInput = buildRemoveMemberIntentInput({ session, member, client });
      return createIntent(removeMemberIntentLWMDefinition, intentInput, {
        onResult: newTree => onResult(newTree, member, session),
      });
    },
    onCompleted,
  });

  function onResult(newTree: KeyRingTreeUpdate, member: KeyRingMember, runSession: KeyRingSession) {
    accept(newTree, runSession, member);
  }

  function onCompleted() {
    const member = removedMemberRef.current;
    if (!member) return;
    step.finish();
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncManageInstancesSuccess,
      params: { member },
    });
  }

  return step;
}
