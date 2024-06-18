import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import {
  memberCredentialsSelector,
  resetTrustchainStore,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";

enum QueryKey {
  getMembers = "useGetMembers",
  deleteMember = "removeMember",
}

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
  const memberCredentials = useSelector(memberCredentialsSelector);

  if (!trustchain || !memberCredentials) {
    throw new Error("trustchain or memberCredentials is missing");
  }

  const { isLoading: isLiveJWTLoading, data: liveJWT } = useQuery({
    queryKey: [trustchain, memberCredentials],
    queryFn: () => sdk.auth(trustchain, memberCredentials),
    // refetchInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    // staleTime: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    // select: data => format(data, cryptoCurrenciesList),
  });

  return { isLiveJWTLoading, liveJWT, trustchain, memberCredentials };
}

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  if (!trustchain || !memberCredentials) {
    throw new Error("trustchain or memberCredentials is missing");
  }

  const { isLiveJWTLoading, liveJWT } = useLiveAuthenticate();
  const {
    isLoading: isMembersLoading,
    data: instances,
    isError,
  } = useQuery({
    queryKey: [QueryKey.getMembers, liveJWT?.accessToken, trustchain.rootId],
    queryFn: () => liveJWT && sdk.getMembers(liveJWT, trustchain),
  });

  return { isMembersLoading: isMembersLoading || isLiveJWTLoading, instances, isError };
}

export function useRemoveMembers() {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);

  const queryClient = useQueryClient();
  const removeMember = async (member: TrustchainMember) => {
    console.log("MEMBER TO REMOVE", member);
    const seedIdToken = await runWithDevice("", transport => sdk.authWithDevice(transport));
    runWithDevice("", transport =>
      sdk.removeMember(
        transport,
        seedIdToken,
        trustchain as Trustchain,
        memberCredentials as MemberCredentials,
        member,
      ),
    ).then(({ jwt, trustchain }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      if (member.id === memberCredentials?.pubkey) {
        dispatch(resetTrustchainStore());
      } else {
        dispatch(setTrustchain(trustchain));
      }
    });
  };

  const removeMemberMutation = useMutation({
    mutationFn: (member: TrustchainMember) => removeMember(member),
    mutationKey: [QueryKey.deleteMember],
    onSuccess: () =>
      dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted })),
    onError: error => console.error("Error while removing member", error),
  });

  return removeMemberMutation;
}

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");
  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
