import { DomainServiceResolution, SupportedRegistries } from "../types";

export type DomainServiceResponseLoaded = {
  status: "loaded";
  resolutions: DomainServiceResolution[];
  updatedAt: number;
};
export type DomainServiceResponseQueued = { status: "queued" };
export type DomainServiceResponseLoading = { status: "loading" };
export type DomainServiceResponseError = {
  status: "error";
  error: any;
  updatedAt: number;
};

export type DomainServiceStatus =
  | DomainServiceResponseQueued
  | DomainServiceResponseLoading
  | DomainServiceResponseLoaded
  | DomainServiceResponseError;

export type DomainServiceContextState = {
  cache: Record<string, DomainServiceStatus>;
};

export type DomainServiceContextAPI = {
  loadDomainServiceAPI: (
    domainOrAddress: string,
    registry?: SupportedRegistries
  ) => Promise<void>;
  clearCache: () => void;
};

export type DomainServiceContextType = DomainServiceContextState &
  DomainServiceContextAPI;
