import { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { createIntent } from "@features/platform-device-intent";
import {
  acceptLedgerSyncResult,
  assertKeyRingMember,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingSession,
  type KeyRingTreeUpdate,
  type RemoveMemberIntent,
  type RemoveMemberIntentInput,
} from "@features/platform-key-ring";
import { useDispatch, useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { removeMemberIntentLWMDefinition } from "../../deviceIntents/removeMemberIntent/intentLWMDefinition";
import { useKeyRingClient } from "../../hooks/useKeyRingClient";
import { ledgerSyncResultOrder } from "../../deviceIntents/ledgerSyncResultOrder";
import {
  type LedgerSyncStepNavigation,
  useLedgerSyncIntentStep,
} from "../../deviceIntents/useLedgerSyncIntentStep";

export type RemoveInstanceStepInput = Readonly<{ member: KeyRingMember }>;

type Props = Readonly<{ input: RemoveInstanceStepInput; onClose: () => void }>;

/** The remove member step on DIE, with the outcomes of `useRemoveMember`. */
export function useManageInstancesDeviceIntentStepViewModel({ input, onClose }: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const session = useSelector(selectKeyRingSession);
  const client = useKeyRingClient();

  const removedMemberRef = useRef<KeyRingMember | null>(null);

  const step = useLedgerSyncIntentStep<RemoveMemberIntent, RemoveInstanceStepInput>({
    input,
    onClose,
    buildIntent: ({ member }) => {
      assertKeyRingMember(session);
      const intentInput: RemoveMemberIntentInput = {
        session,
        member,
        client,
        resultOrder: ledgerSyncResultOrder,
      };
      return createIntent(removeMemberIntentLWMDefinition, intentInput, {
        onResult: newTree => onResult(newTree, member, session),
      });
    },
    onCompleted,
  });

  function onResult(newTree: KeyRingTreeUpdate, member: KeyRingMember, runSession: KeyRingSession) {
    if (!dispatch(acceptLedgerSyncResult(commitKeyRingTree(newTree), runSession))) return;
    removedMemberRef.current = member;
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
