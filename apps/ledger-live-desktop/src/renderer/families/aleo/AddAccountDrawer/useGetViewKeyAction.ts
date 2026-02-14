import { useMemo } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  createAction,
  getViewKeyExec,
  type Request,
  type State,
  type ViewKeysByAccountId,
} from "@ledgerhq/live-common/families/aleo/hw/getViewKey/index";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { getEnv } from "@ledgerhq/live-env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";

export function useGetViewKeyAction(): Action<Request, State, ViewKeysByAccountId> {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  const action = useMemo(
    () =>
      createAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
        getEnv("MOCK") ? mockedEventEmitter : getViewKeyExec,
      ),
    [isLdmkConnectAppEnabled],
  );

  return action;
}
