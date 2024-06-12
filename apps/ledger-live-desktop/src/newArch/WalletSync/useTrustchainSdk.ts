import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import {
  liveCredentialsSelector,
  resetTrustchainStore,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { JWT, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

export function runWithDevice<T>(
  deviceId: string | undefined,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return lastValueFrom(withDevice(deviceId || "")(transport => from(fn(transport))));
}

const defaultContext = { applicationId: 16, name: "Ledger Sync LLD" }; // TODO : get name dynamically depending on the platform

export function useLiveAuthenticate() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const liveCredentials = useSelector(liveCredentialsSelector);

  if (!trustchain || !liveCredentials) {
    throw new Error("trustchain or liveCredentials is missing");
  }

  const { isLoading: isLiveJWTLoading, data: liveJWT } = useQuery({
    queryKey: [trustchain, liveCredentials],
    queryFn: () => sdk.liveAuthenticate(trustchain, liveCredentials),
    // refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    // staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    // select: data => format(data, cryptoCurrenciesList),
  });

  return { isLiveJWTLoading, liveJWT };
}

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const liveCredentials = useSelector(liveCredentialsSelector);

  if (!trustchain || !liveCredentials) {
    throw new Error("trustchain or liveCredentials is missing");
  }

  const { isLiveJWTLoading, liveJWT } = useLiveAuthenticate();
  const { isLoading: isMembersLoading, data: instances } = useQuery({
    queryKey: [liveJWT, trustchain],
    queryFn: () => liveJWT && sdk.getMembers(liveJWT, trustchain),
  });

  return { isMembersLoading: isMembersLoading || isLiveJWTLoading, instances };
}

export function useRemoveMembers() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const liveCredentials = useSelector(liveCredentialsSelector);

  if (!trustchain || !liveCredentials) {
    throw new Error("trustchain or liveCredentials is missing");
  }

  const { liveJWT } = useLiveAuthenticate();

  const removeMember = async (member: TrustchainMember, liveJWT: JWT) => {
    runWithDevice("", transport =>
      sdk.removeMember(transport, liveJWT, trustchain, liveCredentials, member),
    ).then(({ jwt, trustchain }) => {
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      if (member.id === liveCredentials?.pubkey) {
        dispatch(resetTrustchainStore());
      } else {
        dispatch(setTrustchain(trustchain));
      }
    });
  };

  const removeMemberMutation = useMutation({
    mutationFn: (member: TrustchainMember) => removeMember(member, liveJWT as JWT),
    mutationKey: ["removeMember"],
    onSuccess: () =>
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted })),
    onError: () =>
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceErrorDeletion })),
  });

  return removeMemberMutation;
}

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK") || true;
  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
