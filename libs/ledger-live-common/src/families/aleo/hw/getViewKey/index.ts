import invariant from "invariant";
import { useCallback, useEffect, useRef, useState } from "react";
import { catchError, concatMap, defer, from, map, scan, type Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import type { GetViewKeyOptions } from "@ledgerhq/coin-aleo/signer/getViewKey";
import type Transport from "@ledgerhq/hw-transport";
import type { AppRequest, AppState } from "../../../../hw/actions/app";
import { createAction as createAppAction } from "../../../../hw/actions/app";
import type { Device } from "../../../../hw/actions/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../../../../hw/connectApp";
import { withDevice } from "../../../../hw/deviceAccess";
import { viewKeyResolver } from "../../setup";

export type ViewKeysByAccountId = Record<string, string | null> | null;

type BaseState = {
  error: Error | null;
  result: ViewKeysByAccountId;
  sharePending: boolean;
  shareProgress: {
    completed: number;
    total: number;
    viewKeys: NonNullable<ViewKeysByAccountId>;
  };
};

export type State = AppState & BaseState;

export type ViewKeyProgress = {
  viewKeys: NonNullable<ViewKeysByAccountId>;
  completed: number;
  total: number;
};

export interface Request extends AppRequest {
  selectedAccounts: Account[];
}

export const getViewKeyExec = (
  transport: Transport,
  request: Request,
): Observable<ViewKeyProgress> => {
  invariant(request.currency, "getViewKey: currency is required");
  invariant(request.selectedAccounts.length > 0, "getViewKey: selectedAccounts cannot be empty");

  const { selectedAccounts, currency } = request;
  const total = selectedAccounts.length;

  return from(selectedAccounts).pipe(
    concatMap(account => {
      const { freshAddressPath: path } = account;
      const options: GetViewKeyOptions = { path, currency };

      return defer(() => viewKeyResolver(transport, options)).pipe(
        map(result => {
          const viewKey = result.viewKey ? result.viewKey : null;
          log("hw", `getViewKey ${currency.id} on ${path}`, result);
          return { accountId: account.id, viewKey };
        }),
        catchError(e => {
          log("hw", `getViewKey ${currency.id} on ${path} FAILED ${String(e)}`);
          throw e;
        }),
      );
    }),
    scan(
      (acc, { accountId, viewKey }) => ({
        viewKeys: { ...acc.viewKeys, [accountId]: viewKey },
        completed: acc.completed + 1,
        total,
      }),
      { viewKeys: {}, completed: 0, total } satisfies ViewKeyProgress,
    ),
  );
};

const initialState: BaseState = {
  error: null,
  result: null,
  sharePending: false,
  shareProgress: {
    completed: 0,
    total: 0,
    viewKeys: {},
  },
};

export const createAction = (
  connectAppExec: (connectAppInput: ConnectAppInput) => Observable<ConnectAppEvent>,
  getViewKey: (transport: Transport, request: Request) => Observable<ViewKeyProgress>,
) => {
  const useHook = (reduxDevice: Device | null | undefined, request: Request): State => {
    const taskFired = useRef(false);
    const [state, setState] = useState<BaseState>(initialState);
    const appState: AppState = createAppAction(connectAppExec).useHook(reduxDevice, {
      appName: request.appName,
      dependencies: request.dependencies,
    });

    const { device, opened, inWrongDeviceForAccount, error } = appState;

    const handleProgress = useCallback((progress: ViewKeyProgress) => {
      const isComplete = progress.completed === progress.total;

      setState(prev => ({
        ...prev,
        error: null,
        result: isComplete ? progress.viewKeys : null,
        sharePending: !isComplete,
        shareProgress: progress,
      }));
    }, []);

    const handleError = useCallback((error: Error) => {
      setState(prev => ({
        ...prev,
        error,
        sharePending: false,
      }));

      taskFired.current = false;
    }, []);

    useEffect(() => {
      if (!device || !opened || inWrongDeviceForAccount || error || taskFired.current) {
        return;
      }

      taskFired.current = true;

      setState({
        ...initialState,
        sharePending: true,
        shareProgress: {
          completed: 0,
          total: request.selectedAccounts.length,
          viewKeys: {},
        },
      });

      const subscription = withDevice(device.deviceId)(transport =>
        getViewKey(transport, request),
      ).subscribe({
        next: handleProgress,
        error: handleError,
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [device, opened, inWrongDeviceForAccount, error, request, handleProgress, handleError]);

    return {
      ...appState,
      ...state,
      error: appState.error || state.error,
    };
  };

  return {
    useHook,
    mapResult: (state: State): ViewKeysByAccountId => state.result,
  };
};
