export type AnalyticProps = {
  eventName: string;
  payload: Record<string, unknown>;
};
export type AnalyticMetadata = {
  [key: string]: {
    [key: string]: AnalyticProps;
  };
};
