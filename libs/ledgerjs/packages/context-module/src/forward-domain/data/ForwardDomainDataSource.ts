export type GetForwardDomainInfosParams = {
  domain: string;
  challenge: string;
};

export interface ForwardDomainDataSource {
  getDomainNamePayload(params: GetForwardDomainInfosParams): Promise<string | undefined>;
}
