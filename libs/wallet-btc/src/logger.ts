export type LogFn = (type: string, message: string, data?: unknown) => void;
export const noopLog: LogFn = () => {};
