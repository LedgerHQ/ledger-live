export type SupportedRegistries = "ens" | "sns";

export type DomainServiceResolution = {
  registry: SupportedRegistries;
  domain: string;
  address: string;
  type: "forward" | "reverse";
};
