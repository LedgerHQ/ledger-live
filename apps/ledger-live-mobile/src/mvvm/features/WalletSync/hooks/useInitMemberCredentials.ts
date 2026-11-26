import { commitKeyRingMemberKey } from "@features/platform-key-ring";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useKeyRingClient } from "./useKeyRingClient";

export function useInitMemberCredentials() {
  const client = useKeyRingClient();
  const dispatch = useDispatch();

  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);

  const generateMemberCredentials = useCallback(async () => {
    if (!hasMemberKey) {
      const memberKey = await client.createMemberKey();
      dispatch(commitKeyRingMemberKey(memberKey));
    }
  }, [hasMemberKey, client, dispatch]);

  useEffect(() => {
    generateMemberCredentials();
  }, [generateMemberCredentials]);

  return { hasMemberKey, generateMemberCredentials };
}
