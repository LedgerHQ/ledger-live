export class ErrorWithCode extends Error {
  constructor(public code: number) {
    super();
  }
}

export class ErrorWithResponseStatus extends Error {
  constructor(public responseStatus: string) {
    super();
  }
}

export class AxiosLikeError extends Error {
  constructor(public response: { status: number }) {
    super();
  }
}
