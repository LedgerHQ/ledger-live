import { commitKeyRingTree, selectKeyRingSession } from "@features/platform-key-ring";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { QueryKey } from "./type.hooks";
import { useKeyRingClient } from "./useKeyRingClient";

export const useRestoreTrustchain = () => {
  const dispatch = useDispatch();
  const sdk = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);

  async function restoreTrustchain() {
    const newTrustchain = await sdk.restore(session);

    dispatch(commitKeyRingTree(newTrustchain));

    return newTrustchain;
  }

  const restore = useQuery({
    enabled: false,
    queryKey: [QueryKey.restoreTrustchain],
    queryFn: restoreTrustchain,
  });

  return restore;
};
