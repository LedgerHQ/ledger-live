/*

In a real use case you should use live-network library like this :

import network from "@ledgerhq/live-network/network";


instead of this mocked method

*/

export const network = (params: { url: string; method: "GET" | "POST" }) => {
  switch (true) {
    case params.url.includes("simulate"):
      break;
    case params.url.includes("submit"):
      break;
    case params.url.includes("account_info"):
      break;
    case params.url.includes("transactions"):
      break;
    default:
      throw new Error("Mock network 404");
  }
};
