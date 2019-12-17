// @flow

export * from "./live-common-setup-base";
import axios from "axios";
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";

let setupCalled = false;
export const setup = (testId: string) => {
  if (setupCalled) return;
  setupCalled = true;
  implementLibcore({
    lib: () => require("@ledgerhq/ledger-core"), // eslint-disable-line global-require
    dbPath: "./libcoredb/" + testId
  });

  axios.interceptors.response.use(
    r => r,
    error => {
      error.response &&
        console.warn("http error", error.response.status, error.request.path);
      return Promise.reject(error);
    }
  );

  jest.setTimeout(120000);
};

export const simulateNetwork = (_enabled: boolean) => {
  // TODO
};
