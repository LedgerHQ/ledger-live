type MethodType = "GET" | "POST";
export type NetworkRequestCall = (options: {
  method: MethodType;
  url?: string;
  data?: any;
}) => Promise<any>;

export const mockNetworkRequestCall =
  (response: any): NetworkRequestCall =>
  async (_options: {
    method: MethodType;
    url?: string;
    data?: any;
  }): Promise<any> => {
    return Promise.resolve(response);
  };
