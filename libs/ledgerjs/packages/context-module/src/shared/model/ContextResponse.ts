type ContextSuccess = {
  type:
    | "provideERC20TokenInformation"
    | "provideNFTInformation"
    | "provideDomainName"
    | "setPlugin"
    | "setExternalPlugin";
  payload: string;
};

type ContextError = {
  type: "error";
  error: Error;
};

export type ContextResponse = ContextSuccess | ContextError;
