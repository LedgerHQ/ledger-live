import HttpTransport from "./HttpTransport";
import WebSocketTransport from "./WebSocketTransport";
import Transport from "@ledgerhq/hw-transport";
import type { Observer, DescriptorEvent, Subscription } from "@ledgerhq/hw-transport";

const getTransport = url => (!url.startsWith("ws") ? HttpTransport : WebSocketTransport);

type InS = string | string[];
type InP = Promise<InS> | InS;
type In = InP | (() => InP);

const inferURLs = async (urls: In): Promise<string[]> => {
  const r = await (typeof urls === "function" ? urls() : urls);
  return typeof r === "string" ? [r] : r;
};

export default (urls: In): typeof Transport => {
  class StaticTransport extends Transport {
    static isSupported = HttpTransport.isSupported;
    static list = (): Promise<string[]> =>
      inferURLs(urls)
        .then(urls =>
          Promise.all(
            urls.map(url =>
              getTransport(url)
                .check(url)
                .then(() => [url])
                .catch(() => []),
            ),
          ),
        )
        .then(arrs => arrs.reduce<string[]>((acc, a) => acc.concat(a), []));
    static listen = (observer: Observer<DescriptorEvent<unknown>>): Subscription => {
      let unsubscribed = false;
      const seen = {};

      function checkLoop() {
        if (unsubscribed) return;
        inferURLs(urls)
          .then(urls =>
            Promise.all(
              urls.map(async url => {
                if (unsubscribed) return;

                try {
                  await getTransport(url).check(url);
                  if (unsubscribed) return;

                  if (!seen[url]) {
                    seen[url] = 1;
                    observer.next({
                      type: "add",
                      descriptor: url,
                    });
                  }
                } catch (e) {
                  // nothing
                  if (seen[url]) {
                    delete seen[url];
                    observer.next({
                      type: "remove",
                      descriptor: url,
                    });
                  }
                }
              }),
            ),
          )
          .then(() => new Promise(success => setTimeout(success, 5000)))
          .then(checkLoop);
      }

      checkLoop();
      return {
        unsubscribe: () => {
          unsubscribed = true;
        },
      };
    };
    static open = url => getTransport(url).open(url);
  }

  return StaticTransport;
};
