import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import {
  memberCredentialsSelector,
  resetTrustchainStore,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import Transport, { TransportStatusError } from "@ledgerhq/hw-transport";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";
import { randomUUID } from "crypto";
import { useEffect } from "react";

enum QueryKey {
  getMembers = "useGetMembers",
  deleteMember = "removeMember",
  auth = "auth",
}

export function runWithDevice<T>(
  deviceId: string | undefined,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return lastValueFrom(withDevice(deviceId || "")(transport => from(fn(transport))));
}

const defaultContext = { applicationId: 16, name: `LLD Sync ${randomUUID()}` }; // TODO : get name dynamically depending on the platform

export function useLiveAuthenticate() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const dispatch = useDispatch();

  const {
    isLoading: isLiveJWTLoading,
    data: liveJWT,
    isError,
    error,
  } = useQuery({
    queryKey: [QueryKey.auth],
    queryFn: () => sdk.auth(trustchain as Trustchain, memberCredentials as MemberCredentials),
    retry: false,
  });

  useEffect(() => {
    if (!trustchain || !memberCredentials || isError) {
      dispatch(resetTrustchainStore());
      dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
    }

    if (isError) {
      console.error("Error while authenticating", error);
    }
  }, [dispatch, error, isError, memberCredentials, trustchain]);

  return { isLiveJWTLoading, liveJWT, trustchain, memberCredentials, error, isError };
}

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const dispatch = useDispatch();

  const memberCredentials = useSelector(memberCredentialsSelector);

  if (!trustchain) {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  }

  const { isLiveJWTLoading, liveJWT } = useLiveAuthenticate();

  const {
    isLoading: isMembersLoading,
    data: instances,
    isError: isErrorGetMembers,
  } = useQuery({
    enabled: !!liveJWT && !!trustchain,
    queryKey: [QueryKey.getMembers, trustchain],
    queryFn: () => sdk.getMembers(liveJWT as JWT, trustchain as Trustchain),
    refetchOnMount: true,
  });

  useEffect(() => {
    if (
      memberCredentials &&
      !instances
        ?.map((instance: TrustchainMember) => instance.id)
        .includes(memberCredentials?.pubkey)
    ) {
      dispatch(resetTrustchainStore());
      dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
    }
  }, [instances, memberCredentials, dispatch]);

  return {
    isMembersLoading: isMembersLoading || isLiveJWTLoading,
    instances,
    isError: isErrorGetMembers,
  };
}

export function useRemoveMembers() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  let canGoNext = false;

  const removeMember = async (member: TrustchainMember) => {
    console.log("MEMBER TO REMOVE", member);
    const seedIdToken = await runWithDevice("", transport => sdk.authWithDevice(transport));
    const { trustchain: newTrustchain } = await runWithDevice("", transport =>
      sdk.removeMember(
        transport,
        seedIdToken,
        trustchain as Trustchain,
        memberCredentials as MemberCredentials,
        member,
        {
          onStartRequestUserInteraction: () => {},
          onEndRequestUserInteraction: () => {
            canGoNext = true;
          },
        },
      ),
    );

    if (canGoNext) {
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      if (member.id === memberCredentials?.pubkey) {
        dispatch(resetTrustchainStore());
      } else {
        dispatch(setTrustchain(newTrustchain));
      }
    }
  };

  const removeMemberMutation = useMutation({
    mutationFn: (member: TrustchainMember) => removeMember(member),
    mutationKey: [QueryKey.deleteMember],
    onError: error => {
      console.error("Error while removing member", error);

      if (!(error instanceof TransportStatusError)) {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      }
    },
  });

  return removeMemberMutation;
}

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");
  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
