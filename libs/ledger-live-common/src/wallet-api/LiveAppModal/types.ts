export type LiveAppModalUseCase = "earn";

export type LiveAppModalOpenParams = {
  path: string;
  payload?: unknown;
  title?: string;
  description?: string;
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
  useCase?: LiveAppModalUseCase;
};

export type LiveAppModalState = LiveAppModalParams | null;

export function resolveLiveAppModalParams(
  input: LiveAppModalOpenParams & { requestId: string },
  manifestId: string,
): LiveAppModalParams {
  const { requestId, path, title, description, useCase } = input;
  return {
    requestId,
    manifestId,
    path,
    title,
    description,
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
