type MethodType = "GET" | "POST";
export type NetworkRequestCall = (options: {
  method: MethodType;
  url?: string;
  data?: any;
  headers?: any;
}) => Promise<any>;
