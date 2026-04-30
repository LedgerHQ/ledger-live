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
