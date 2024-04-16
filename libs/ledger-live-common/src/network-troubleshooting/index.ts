import { WebsocketConnectionError } from "@ledgerhq/errors";
import axios from "axios";
import WS from "isomorphic-ws";
import { Observable } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import announcementsApi from "../notifications/AnnouncementProvider/api/api";
import serviceStatusApi from "../notifications/ServiceStatusProvider/api/api";

export type TroubleshootStatus = {
  title: string;
  technicalDescription: string;
  status: "success" | "error" | "loading";
  error?: string;
};

type Troubleshoot = {
  title: string;
  technicalDescription: string;
  job: Promise<unknown>;
};

// Run all checks and return. each troubleshoot have a promise that suceed if the underlying job worked.
export function troubleshoot(): Troubleshoot[] {
  // TODO in future, we can delegate a "troubleshoot" per coin implementation.
  return [
    {
      title: "My Ledger services (scriptrunner)",
      ...websocketConnects(
        `${getEnv(
          "BASE_SOCKET_URL",
        )}/apps/list?targetId=856686596&perso=perso_11&livecommonversion=27.7.2`, // TODO have a dummy echo endpoint
      ),
    },
    {
      title: "Bitcoin explorers",
      ...httpGet(getEnv("EXPLORER") + "/blockchain/v4/btc/block/current"),
    },
    {
      title: "Ethereum explorers",
      ...httpGet(getEnv("EXPLORER") + "/blockchain/v4/eth/block/current"),
    },
    {
      title: "Countervalues API",
      ...httpGet(`${getEnv("LEDGER_COUNTERVALUES_API")}/v3/spot/simple?froms=bitcoin&to=eur`),
    },
    {
      title: "Announcements",
      technicalDescription: "fetching announcements",
      job: announcementsApi.fetchAnnouncements(),
    },
    {
      title: "Status",
      technicalDescription: "fetching status",
      job: serviceStatusApi.fetchStatusSummary(),
    },
  ];
}

function httpGet(url) {
  return {
    technicalDescription: "fetching " + url,
    job: axios.get(url, { timeout: 30000 }),
  };
}

function websocketConnects(url) {
  const job = new Promise((resolve, reject) => {
    const ws = new WS(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("timeout"));
    }, 30000);
    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(url);
      ws.close();
    };
    ws.onerror = e => {
      reject(e);
    };
    ws.onclose = () => {
      reject(new WebsocketConnectionError("closed"));
    };
  });
  return {
    technicalDescription: "connecting to " + url,
    job,
  };
}

type TroubleshootEvent =
  | {
      type: "init";
      all: TroubleshootStatus[];
    }
  | {
      type: "change";
      status: TroubleshootStatus;
    };

export function troubleshootOverObservable(): Observable<TroubleshootEvent> {
  return new Observable(o => {
    try {
      const all = troubleshoot();
      o.next({
        type: "init",
        all: all.map(s => ({
          title: s.title,
          technicalDescription: s.technicalDescription,
          status: "loading",
        })),
      });

      let total = 0;
      all.forEach(s => {
        s.job
          .then(
            () => {
              o.next({
                type: "change",
                status: {
                  title: s.title,
                  technicalDescription: s.technicalDescription,
                  status: "success",
                },
              });
            },
            e => {
              o.next({
                type: "change",
                status: {
                  title: s.title,
                  technicalDescription: s.technicalDescription,
                  status: "error",
                  error: String(e?.message || e),
                },
              });
            },
          )
          .then(() => {
            if (++total === all.length) {
              o.complete();
            }
          });
      });
    } catch (e) {
      o.error(e);
    }
  });
}

export function troubleshootOverObservableReducer(
  state: TroubleshootStatus[],
  event: TroubleshootEvent,
): TroubleshootStatus[] {
  if (event.type === "init") {
    return event.all;
  }
  if (event.type === "change") {
    return state.map(s => (s.title === event.status.title ? event.status : s));
  }
  return state;
}
