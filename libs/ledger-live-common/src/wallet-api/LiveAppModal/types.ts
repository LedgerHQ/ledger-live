export type LiveAppModalSize = "full" | "medium";

export type LiveAppModalUseCase = "earn";

export type LiveAppModalOpenParams = {
  path: string;
  manifestId?: string;
  payload?: unknown;
  title?: string;
  description?: string;
  size?: LiveAppModalSize;
  useCase?: LiveAppModalUseCase;
};

export type LiveAppModalOpenResult = {
  requestId: string;
  result?: unknown;
};

export type LiveAppModalGetInitialPayloadParams = {
  requestId: string;
};

export type LiveAppModalGetInitialPayloadResult = {
  payload: unknown;
};

export type LiveAppModalCloseParams = {
  requestId: string;
  result?: unknown;
};

export type LiveAppModalCloseResult = void;

export type LiveAppModalParams = {
  requestId: string;
  manifestId: string;
  path: string;
  title?: string;
  description?: string;
  size?: LiveAppModalSize;
  useCase?: LiveAppModalUseCase;
};

export type LiveAppModalState = LiveAppModalParams | null;

export function resolveLiveAppModalParams(
  input: LiveAppModalOpenParams & { requestId: string },
  fallbackManifestId: string,
): LiveAppModalParams {
  const { requestId, manifestId, path, title, description, size, useCase } = input;
  return {
    requestId,
    manifestId: manifestId || fallbackManifestId,
    path,
    title,
    description,
    size,
    useCase,
  };
}

export class LiveAppModalAlreadyOpenError extends Error {
  constructor() {
    super("A live-app modal is already open");
    this.name = "LiveAppModalAlreadyOpenError";
  }
}

export class LiveAppModalUnknownRequestIdError extends Error {
  constructor(requestId: string) {
    super(`No live-app modal found for requestId: ${requestId}`);
    this.name = "LiveAppModalUnknownRequestIdError";
  }
}
