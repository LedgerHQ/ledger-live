import type { ApiServiceDescriptor } from "../../compose";
import { portfolioApi, portfolioApiExtra, type PortfolioApi } from "./api";
import type { PortfolioApiExtra } from "./types";

export function portfolioService(own: () => PortfolioApiExtra): ApiServiceDescriptor<PortfolioApi> {
  return { api: portfolioApi, buildExtra: () => portfolioApiExtra(own()) };
}
