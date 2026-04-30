import { createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import * as registry from "./registry";
import {
  LiveAppModalCloseParams,
  LiveAppModalCloseResult,
  LiveAppModalGetInitialPayloadParams,
  LiveAppModalGetInitialPayloadResult,
  LiveAppModalOpenParams,
  LiveAppModalOpenResult,
  LiveAppModalSize,
  LiveAppModalUseCase,
} from "./types";

export type LiveAppModalUiHookOpenParams = {
  requestId: string;
  manifestId?: string;
  path: string;
  title?: string;
  description?: string;
  size?: LiveAppModalSize;
  useCase?: LiveAppModalUseCase;
};

export type LiveAppModalUiHooks = {
  "custom.liveApp.modal.open": (params: LiveAppModalUiHookOpenParams) => void;
};

type Handlers = {
  "custom.liveApp.modal.open": RPCHandler<LiveAppModalOpenResult, LiveAppModalOpenParams>;
  "custom.liveApp.modal.getInitialPayload": RPCHandler<
    LiveAppModalGetInitialPayloadResult,
    LiveAppModalGetInitialPayloadParams
  >;
  "custom.liveApp.modal.close": RPCHandler<LiveAppModalCloseResult, LiveAppModalCloseParams>;
};

export const handlers = ({ uiHooks }: { uiHooks: LiveAppModalUiHooks }) =>
  ({
    "custom.liveApp.modal.open": customWrapper<LiveAppModalOpenParams, LiveAppModalOpenResult>(
      async params => {
        if (!params || !params.path) {
          throw new ServerError(createUnknownError({ message: "path is required" }));
        }
        const { requestId, promise } = registry.createRequest({ payload: params.payload });
        // Attach a no-op catch so that if the uiHook throws (or cancels) and we reject
        // this promise before any `await promise` has happened, Node does not flag it
        // as an unhandled rejection. The real rejection is propagated to the caller
        // via `await promise` below (or via the explicit throw when uiHook fails).
        promise.catch(() => {});
        try {
          uiHooks["custom.liveApp.modal.open"]({
            requestId,
            manifestId: params.manifestId,
            path: params.path,
            title: params.title,
            description: params.description,
            size: params.size,
            useCase: params.useCase,
          });
        } catch (err) {
          const error =
            err instanceof Error
              ? err
              : new ServerError(createUnknownError({ message: String(err) }));
          registry.cancel(requestId, error);
          throw error;
        }
        const { result } = await promise;
        return { requestId, result };
      },
    ),
    "custom.liveApp.modal.getInitialPayload": customWrapper<
      LiveAppModalGetInitialPayloadParams,
      LiveAppModalGetInitialPayloadResult
    >(async params => {
      if (!params || !params.requestId) {
        throw new ServerError(createUnknownError({ message: "requestId is required" }));
      }
      const payload = registry.getPayload(params.requestId);
      return { payload };
    }),
    "custom.liveApp.modal.close": customWrapper<LiveAppModalCloseParams, LiveAppModalCloseResult>(
      async params => {
        if (!params || !params.requestId) {
          throw new ServerError(createUnknownError({ message: "requestId is required" }));
        }
        registry.close(params.requestId, params.result);
      },
    ),
  }) as const satisfies Handlers;
