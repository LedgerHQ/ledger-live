import * as domainApi from "@domain/api-swap-quotes";
import * as domainStore from "@domain/api-swap-quotes/store";
import * as domainStandalone from "@domain/api-swap-quotes/store.standalone";

import * as api from "./api";
import * as standaloneStore from "./standaloneStore";
import * as store from "./store";

/**
 * These modules are re-export shims kept so the apps and wallet-cli can go on
 * importing the live-common paths after the endpoint moved to
 * `@domain/api-swap-quotes`. A broken re-export would only show up at app
 * startup, so pin the identity of what they forward.
 */
describe("live-common swap quotes shims", () => {
  it("forwards the endpoint and its helpers", () => {
    expect(api.swapQuotesApi).toBe(domainApi.swapQuotesApi);
    expect(api.buildQuotesParams).toBe(domainApi.buildQuotesParams);
    expect(api.splitQuotes).toBe(domainApi.splitQuotes);
    expect(api.transformFetchQuotesResponse).toBe(domainApi.transformFetchQuotesResponse);
  });

  it("forwards the dispatch holder used by both apps at startup", () => {
    expect(store.setSwapQuotesStore).toBe(domainStore.setSwapQuotesStore);
    expect(store.getSwapQuotesDispatch).toBe(domainStore.getSwapQuotesDispatch);
    expect(store.resetSwapQuotesStore).toBe(domainStore.resetSwapQuotesStore);
  });

  it("forwards the standalone store used by wallet-cli", () => {
    expect(standaloneStore.setupStandaloneSwapQuotesStore).toBe(
      domainStandalone.setupStandaloneSwapQuotesStore,
    );
  });
});
