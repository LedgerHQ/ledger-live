export type NamingServiceStatus =
  | { status: "queued" }
  | { status: "loading" }
  | { status: "loaded"; address: string; name: string; updatedAt: number }
  | { status: "error"; error: any; updatedAt: number };

export type NamingServiceContextState = {
  cache: Record<string, NamingServiceStatus>;
};

export type NamingServiceContextAPI = {
  loadNamingServiceAPI: (name: string) => Promise<void>;
  clearCache: () => void;
};

export type NamingServiceContextType = NamingServiceContextState &
  NamingServiceContextAPI;

export type NamingServiceResponseLoaded = {
  status: "loaded";
  address: string;
  name: string;
};

export type UseNamingServiceResponse =
  | { status: Exclude<NamingServiceStatus["status"], "loaded"> }
  | NamingServiceResponseLoaded;
