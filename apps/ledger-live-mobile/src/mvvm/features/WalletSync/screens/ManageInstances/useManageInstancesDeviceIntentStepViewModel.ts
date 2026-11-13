import { useRef } from "react";
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
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { removeMemberIntentLWMDefinition } from "../../deviceIntents/removeMemberIntent/intentLWMDefinition";
import { useCreateSessionSdk } from "../../deviceIntents/useCreateSessionSdk";
import { useIsCurrentMemberCredentials } from "../../deviceIntents/useIsCurrentMemberCredentials";
import {
  type LedgerSyncStepNavigation,
  useLedgerSyncIntentStep,
} from "../../deviceIntents/useLedgerSyncIntentStep";

export type RemoveInstanceStepInput = Readonly<{ member: TrustchainMember }>;

type Props = Readonly<{ input: RemoveInstanceStepInput; onClose: () => void }>;

/** The remove member step on DIE, with the outcomes of `useRemoveMember`. */
export function useManageInstancesDeviceIntentStepViewModel({ input, onClose }: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const createSessionSdk = useCreateSessionSdk();
  const isCurrentMemberCredentials = useIsCurrentMemberCredentials();

  const removedMemberRef = useRef<TrustchainMember | null>(null);

  const step = useLedgerSyncIntentStep<RemoveMemberIntent, RemoveInstanceStepInput>({
    input,
    onClose,
    buildIntent: ({ member }) => {
      if (!trustchain || !memberCredentials) {
        throw new TrustchainEjected("trustchain or memberCredentials is not set");
      }
      const intentInput: RemoveMemberIntentInput = {
        trustchain,
        memberCredentials,
        member,
        createSessionSdk,
      };
      return createIntent(removeMemberIntentLWMDefinition, intentInput, {
        onResult: newTrustchain => onResult(newTrustchain, member, memberCredentials),
      });
    },
    onCompleted,
  });

  function onResult(
    newTrustchain: Trustchain,
    member: TrustchainMember,
    runCredentials: MemberCredentials,
  ) {
    if (!isCurrentMemberCredentials(runCredentials)) return;
    dispatch(setTrustchain(newTrustchain));
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
