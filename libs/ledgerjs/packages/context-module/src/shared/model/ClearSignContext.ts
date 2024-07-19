type ClearSignContextSuccess = {
  type:
    | "provideERC20TokenInformation"
    | "provideNFTInformation"
    | "provideDomainName"
    | "setPlugin"
    | "setExternalPlugin";
  payload: string;
};

type ClearSignContextError = {
  type: "error";
  error: Error;
};

export type ClearSignContext = ClearSignContextSuccess | ClearSignContextError;
