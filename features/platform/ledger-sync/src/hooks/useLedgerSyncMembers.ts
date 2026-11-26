import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { selectHasKeyRingMemberKey, selectIsKeyRingMember } from "@domain/entity-key-ring";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { LedgerSyncMembersUnresolvedError } from "../errors";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncMembers, LedgerSyncMembersOptions } from "../types";
import { useLedgerSyncSelector } from "../internals/store";

/**
 * The members of the key tree, fetched again on mount, focus, reconnection and key rotation,
 * never retried. While the query is in error, `onError` runs after each render. A `refetch`
 * without a member key fails with `LedgerSyncMembersUnresolvedError`.
 *
 * @example
 * ```ts
 * const { handleError } = useLedgerSyncErrorRecovery({ client, onReset });
 * const { data: instances, isLoading } = useLedgerSyncMembers({ client, onError: handleError });
 * ```
 */
export function useLedgerSyncMembers({
  client,
  onError,
}: LedgerSyncMembersOptions): LedgerSyncMembers {
  const session = useLedgerSyncSelector(selectKeyRingSession);
  const isMember = useLedgerSyncSelector(selectIsKeyRingMember);
  const hasMemberKey = useLedgerSyncSelector(selectHasKeyRingMemberKey);
  // Changes with the key of the key tree, so a rotation refetches the members.
  const streamRef = useMemo(() => client.openStream(session)?.ref ?? null, [client, session]);

  const queryKey = [LedgerSyncQueryKey.members, streamRef];

  function fetchMembers() {
    if (!hasMemberKey) {
      throw new LedgerSyncMembersUnresolvedError(queryKey);
    }
    return client.listMembers(session);
  }

  const members = useQuery({
    queryKey,
    queryFn: () => fetchMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: isMember && hasMemberKey,
  });

  useEffect(() => {
    if (members.isError) {
      onError(members.error);
    }
  }, [onError, members.error, members.isError]);

  return members;
}
