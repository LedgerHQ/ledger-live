export const errors = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  UserRejected: 4001,
  Unauthorized: 4100,
  UnsupportedMethod: 4200,
  Disconnected: 4900,
  ChainDisconnected: 4901,
} as const;

export const rejectedError = (code: number, message: string, data: object = {}) => ({
  code,
  message,
  data: {
    code,
    message,
    ...data,
  },
});
