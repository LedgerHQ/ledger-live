import { selectKeyRingSession } from "@features/platform-key-ring";
import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import { useSelector } from "~/context/hooks";
import { useKeyRingClient } from "./useKeyRingClient";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useLifeCycle } from "./useLifeCycle";
import { useEffect, useMemo } from "react";

export function useGetMembers() {
  const client = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  // Changes with the key of the key tree, so a rotation refetches the members.
  const streamRef = useMemo(() => client.openStream(session)?.ref ?? null, [client, session]);

  const { handleError } = useLifeCycle();

  function getMembers() {
    if (!hasMemberKey) {
      return;
    }

    return client.listMembers(session);
  }

  const memberHook = useQuery({
    queryKey: [QueryKey.getMembers, streamRef],
    queryFn: () => getMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: isMember && hasMemberKey,
  });

  useEffect(() => {
    if (memberHook.isError) {
      handleError(memberHook.error);
    }
  }, [handleError, memberHook.error, memberHook.isError]);

  return memberHook;
}
