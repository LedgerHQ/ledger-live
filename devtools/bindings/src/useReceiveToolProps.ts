import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { setOverride } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";
import {
  markReceiveVerifyHintSeen,
  resetReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-receive/state";

type ReceiveToolProps = Extract<DevToolsConfig[number], { id: "receive" }>["config"];
type ReceiveTrigger = ReceiveToolProps["trigger"];

const NO_FAMILIES: readonly string[] = [];

/**
 * The flag and the verify hint live in shared state; opening the receive flow is app routing, so the
 * host passes the trigger. Requires the host to mount the verify hint slice (desktop and mobile do).
 */
export function useReceiveToolProps(trigger: ReceiveTrigger): ReceiveToolProps {
  const dispatch = useDispatch();
  const flag = useFeature("newReceiveFlow");
  const hasSeenVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);

  const enabled = !!flag?.enabled;
  const excludedFamilies = flag?.params?.excludedFamilies ?? NO_FAMILIES;

  const setEnabled = useCallback(
    (nextEnabled: boolean) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled: nextEnabled, params: { excludedFamilies: [...excludedFamilies] } },
        }),
      ),
    [dispatch, excludedFamilies],
  );

  const setExcludedFamilies = useCallback(
    (families: readonly string[]) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled, params: { excludedFamilies: [...families] } },
        }),
      ),
    [dispatch, enabled],
  );

  const setHasSeenVerifyHint = useCallback(
    (hasSeen: boolean) =>
      dispatch(hasSeen ? markReceiveVerifyHintSeen() : resetReceiveVerifyHintSeen()),
    [dispatch],
  );

  return useMemo(
    () => ({
      flag: { enabled, excludedFamilies, setEnabled, setExcludedFamilies },
      verifyHint: { hasSeen: hasSeenVerifyHint, setHasSeen: setHasSeenVerifyHint },
      trigger,
    }),
    [
      enabled,
      excludedFamilies,
      setEnabled,
      setExcludedFamilies,
      hasSeenVerifyHint,
      setHasSeenVerifyHint,
      trigger,
    ],
  );
}
