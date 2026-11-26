import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { useSelector } from "LLD/hooks/redux";
import { useKeyRingClient } from "./useKeyRingClient";
import { QueryKey } from "./type.hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useLifeCycle } from "./walletSync.hooks";

export function useGetMembers() {
  const sdk = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const { handleError } = useLifeCycle();
  // Changes with each key rotation, so the members list is fetched again after one.
  const treeStreamRef = useMemo(() => sdk.openStream(session)?.ref ?? null, [sdk, session]);

  function fetchMembers() {
    if (!hasMemberKey) {
      return;
    }

    return sdk.listMembers(session);
  }

  const {
    isLoading: isMembersLoading,
    data: instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  } = useQuery({
    queryKey: [QueryKey.getMembers, treeStreamRef],
    queryFn: () => fetchMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: isMember && hasMemberKey,
  });

  useEffect(() => {
    if (isErrorGetMembers) {
      handleError(getMembersError);
    }
  }, [handleError, getMembersError, isErrorGetMembers]);

  return {
    isMembersLoading: isMembersLoading,
    instances,
    isError: isErrorGetMembers,
    error: getMembersError,
  };
}
