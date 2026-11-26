import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { commitKeyRingMemberKey } from "@features/platform-key-ring";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useKeyRingClient } from "./useKeyRingClient";

export function useInitMemberCredentials() {
  const sdk = useKeyRingClient();
  const dispatch = useDispatch();

  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);

  const generateMemberCredentials = useCallback(async () => {
    if (!hasMemberKey) {
      const newMemberKey = await sdk.createMemberKey();
      dispatch(commitKeyRingMemberKey(newMemberKey));
    }
  }, [hasMemberKey, sdk, dispatch]);

  useEffect(() => {
    generateMemberCredentials();
  }, [generateMemberCredentials]);

  return { hasMemberKey, generateMemberCredentials };
}
