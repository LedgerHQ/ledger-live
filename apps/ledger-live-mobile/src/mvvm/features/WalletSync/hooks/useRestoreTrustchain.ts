import { commitKeyRingTree, selectKeyRingSession } from "@features/platform-key-ring";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "~/context/hooks";
import { QueryKey } from "./type.hooks";
import { useKeyRingClient } from "./useKeyRingClient";

export const useRestoreTrustchain = () => {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);

  async function restoreTrustchain() {
    const newTree = await client.restore(session);

    dispatch(commitKeyRingTree(newTree));

    return newTree;
  }

  const restore = useQuery({
    enabled: false,
    queryKey: [QueryKey.restoreTrustchain],
    queryFn: restoreTrustchain,
  });

  return restore;
};
