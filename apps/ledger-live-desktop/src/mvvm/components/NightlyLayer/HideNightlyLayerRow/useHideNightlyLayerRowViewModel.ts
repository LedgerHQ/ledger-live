import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHideNightlyLayer } from "~/renderer/actions/settings";
import { hideNightlyLayerSelector } from "~/renderer/reducers/settings";
import { shouldShowNightlyLayer } from "../utils/shouldShowNightlyLayer";

type HideNightlyLayerRowViewModelResult = {
  readonly isAvailable: boolean;
  readonly isHidden: boolean;
  readonly onChange: (checked: boolean) => void;
};

export function useHideNightlyLayerRowViewModel(): HideNightlyLayerRowViewModelResult {
  const dispatch = useDispatch();
  const isHidden = useSelector(hideNightlyLayerSelector);

  const onChange = useCallback(
    (checked: boolean) => {
      dispatch(setHideNightlyLayer(checked));
    },
    [dispatch],
  );

  return {
    isAvailable: shouldShowNightlyLayer(__PRERELEASE__, __CHANNEL__),
    isHidden,
    onChange,
  };
}
