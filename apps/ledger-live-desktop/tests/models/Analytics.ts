import { Page, Request } from "@playwright/test";

type RequestData = {
  event: string;
  properties: Record<string, unknown>;
};

function isShallowSubset(x: Record<string, unknown>, y: Record<string, unknown>): boolean {
  return Object.keys(x).every(key => y.hasOwnProperty(key) && x[key] === y[key]);
}

export class Analytics {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForTracking({
    event,
    properties,
    timeout = 5000,
  }: {
    event: string;
    properties?: Record<string, unknown> | null;
    timeout?: number;
  }) {
    return this.page.waitForRequest(
      (request: Request) => {
        const url = request.url();

        if (url !== "https://api.segment.io/v1/t") return false;

        const data: RequestData = request.postDataJSON();
        if (data.event !== event) return false;
        if (!properties) return true;

        return isShallowSubset(properties, data.properties);
      },
      { timeout },
    );
  }
}
