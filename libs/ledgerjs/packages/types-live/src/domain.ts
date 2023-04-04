export type SupportedRegistries = "ens";

export type DomainServiceResolution = {
  registry: SupportedRegistries;
  domain: string;
  address: string;
  type: "forward" | "reverse";
};
