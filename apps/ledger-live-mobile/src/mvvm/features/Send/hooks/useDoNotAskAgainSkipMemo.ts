import { useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { setDoNotAskAgainSkipMemo } from "~/actions/settings";
import { doNotAskAgainSkipMemoSelector } from "~/reducers/settings";

export function useDoNotAskAgainSkipMemo(): [boolean, (doNotAskAgainSkipMemo: boolean) => void] {
  const dispatch = useDispatch();
  const value = useSelector(doNotAskAgainSkipMemoSelector);
  const setter = useCallback(
    (doNotAskAgainSkipMemo: boolean) => {
      dispatch(setDoNotAskAgainSkipMemo(doNotAskAgainSkipMemo));
    },
    [dispatch],
  );
  return [value, setter];
}
