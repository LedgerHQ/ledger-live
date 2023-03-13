export type DomainServiceType = "reverse" | "forward";

export type DomainServiceStatus =
  | { status: "queued" }
  | { status: "loading" }
  | {
      status: "loaded";
      address: string;
      domain: string;
      type: DomainServiceType;
      updatedAt: number;
    }
  | { status: "error"; error: any; updatedAt: number };

export type DomainServiceContextState = {
  cache: Record<string, DomainServiceStatus>;
};

export type DomainServiceContextAPI = {
  loadDomainServiceAPI: (name: string) => Promise<void>;
  clearCache: () => void;
};

export type DomainServiceContextType = DomainServiceContextState &
  DomainServiceContextAPI;

export type DomainServiceResponseLoaded = {
  status: "loaded";
  address: string;
  domain: string;
  type: DomainServiceType;
};
