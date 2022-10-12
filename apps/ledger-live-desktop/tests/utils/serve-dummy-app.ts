import handler from "serve-handler";
import http from "http";
import path from "path";

export const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response, {
    public: path.resolve(__dirname, "dummy-live-app/build"),
  });
});

export const start = (port = 0): Promise<number> => {
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

export const manifest = (port: number) => [
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

export const stop = () => server.close();
