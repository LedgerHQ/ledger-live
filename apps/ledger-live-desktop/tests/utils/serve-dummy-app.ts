import handler from "serve-handler";
import http from "http";
import path from "path";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

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

export const liveAppManifest = (params: Partial<AppManifest> & Pick<AppManifest, "url" | "id">) => {
  const manifest = [
    {
      name: "Generic Live App",
      homepageUrl: "https://developers.ledger.com/",
      icon: "",
      platforms: ["ios", "android", "desktop"],
      apiVersion: "^1.0.0 || ~0.0.1",
      manifestVersion: "1",
      branch: "stable",
      categories: ["tools"],
      currencies: "*",
      content: {
        shortDescription: {
          en: "Generic Live App",
        },
        description: {
          en: "Generic Live App for testing",
        },
      },
      permissions: [
        "account.list",
        "account.receive",
        "account.request",
        "currency.list",
        "device.close",
        "device.exchange",
        "device.transport",
        "message.sign",
        "transaction.sign",
        "transaction.signAndBroadcast",
        "storage.set",
        "storage.get",
        "bitcoin.getXPub",
        "wallet.capabilities",
        "wallet.userId",
        "wallet.info",
      ],
      domains: ["https://*"],
      visibility: "complete",
      ...params,
    },
  ];

  return manifest;
};

export const stop = () => server.close();
