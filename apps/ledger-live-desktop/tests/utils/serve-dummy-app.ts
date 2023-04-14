import handler from "serve-handler";
import http from "http";
import path from "path";

let dummyAppPath: string;

export const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  handler(request, response, {
    public: path.resolve(__dirname, dummyAppPath),
  });
});

export const start = (appPath: string, port = 0): Promise<number> => {
  dummyAppPath = appPath;

  return new Promise((resolve, reject) => {
    server
      .listen(port, "localhost")
      .once("listening", () => {
        resolve((server.address() as any).port as number);
      })
      .once("error", error => {
        server.close();
        reject(error);
      });
  });
};

export const dummyLiveAppManifest = (port: number) => [
  {
    id: "dummy-live-app",
    name: "Dummy Live App",
    url: `http://localhost:${port}`,
    homepageUrl: "https://developers.ledger.com/",
    icon: "",
    platform: "all",
    apiVersion: "^1.0.0 || ~0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["tools"],
    currencies: "*",
    content: {
      shortDescription: {
        en: "Dummy app for testing the Platform apps and Live SDK in E2E (Playwright) tests",
      },
      description: {
        en: "Dummy app for testing the Platform apps and Live SDK in E2E (Playwright) tests",
      },
    },
    permissions: [
      {
        method: "*",
      },
    ],
    domains: ["https://*"],
  },
];

export const dummyBuyAppManifest = (port: number) => [
  {
    id: "multibuy",
    name: "Dummy Buy / Sell App",
    private: false,
    url: `http://localhost:${port}`,
    homepageUrl: "https://developers.ledger.com/",
    icon: "",
    platform: "all",
    apiVersion: "^1.0.0 || ~0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["exchange", "buy"],
    currencies: ["ethereum", "bitcoin", "algorand"],
    content: {
      shortDescription: {
        en: "Dummy app for testing the Buy app is accessed correctly",
      },
      description: {
        en: "Dummy app for testing the Buy app is accessed correctly",
      },
    },
    permissions: [
      {
        method: "account.request",
        params: {
          currencies: ["ethereum", "bitcoin", "algorand"],
        },
      },
    ],
    domains: ["https://*"],
  },
];

export const stop = () => server.close();
