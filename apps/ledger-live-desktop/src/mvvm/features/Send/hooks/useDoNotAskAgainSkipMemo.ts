import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { saveSettings } from "~/renderer/actions/settings";
import { doNotAskAgainSkipMemoSelector } from "~/renderer/reducers/settings";

export function useDoNotAskAgainSkipMemo(): [boolean, (doNotAskAgainSkipMemo: boolean) => void] {
  const dispatch = useDispatch();
  const value = useSelector(doNotAskAgainSkipMemoSelector);
  const setter = useCallback(
    (doNotAskAgainSkipMemo: boolean) => {
      dispatch(
        saveSettings({
          doNotAskAgainSkipMemo,
        }),
      );
    },
    [dispatch],
  );
  return [value, setter];
}
