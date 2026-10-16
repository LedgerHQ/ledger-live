export type PortfolioServiceHeaders = Record<string, string>;

export type PortfolioServiceClientConfig = {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Sent with every request; a provider is called before each request (e.g. to refresh a token). */
  headers?: PortfolioServiceHeaders | (() => Promise<PortfolioServiceHeaders>);
};
