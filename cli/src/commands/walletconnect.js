// @flow
/* eslint-disable no-console */
/* eslint-disable no-fallthrough */
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { from } from "rxjs";
import { first, tap, map, take } from "rxjs/operators";
import { Observable } from "rxjs";
import { log, listen } from "@ledgerhq/logs";
import WalletConnect from "@walletconnect/client";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { parseCallRequest } from "@ledgerhq/live-common/lib/walletconnect";
import type {
  WCCallRequest,
  WCPayload,
} from "@ledgerhq/live-common/lib/walletconnect";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import signMessage from "@ledgerhq/live-common/lib/hw/signMessage";
import { apiForCurrency } from "@ledgerhq/live-common/lib/api/Ethereum";

type Opts = ScanCommonOpts &
  $Shape<{
    walletConnectURI: string,
    walletConnectSession: string,
    verbose: boolean,
    silent: boolean,
  }>;

const start = async (opts: Opts) => {
  let account = await scan(opts).pipe(take(1)).toPromise();

  if (!account) {
    throw new Error("No account");
  }

  log("walletconnect", account);

  const connector = new WalletConnect(
    opts.walletConnectSession
      ? {
          session: JSON.parse(opts.walletConnectSession),
        }
      : {
          // Required
          uri: opts.walletConnectURI,
          // Required
          clientMeta: {
            description: "LedgerLive CLI",
            url: "https://ledger.fr",
            icons: [
              "https://avatars0.githubusercontent.com/u/9784193?s=400&v=4",
            ],
            name: "LedgerLive CLI",
          },
        }
  );

  const rejectRequest = (id, message) => {
    const rejection = {
      id,
      error: { message },
    };

    log("walletconnect", "rejected");
    log("walletconnect", (rejection: any));

    connector.rejectRequest(rejection);
  };

  const approveRequest = (id, result) => {
    const approval = {
      id,
      result,
    };

    log("walletconnect", "approved");
    log("walletconnect", (approval: any));

    connector.approveRequest(approval);
  };

  const handleCallRequest = async (payload: WCPayload) => {
    log("walletconnect", "call_request");
    log("walletconnect", (payload: any));

    let wcCallRequest: WCCallRequest;

    wcCallRequest = await parseCallRequest(account, payload);

    let result;
    const bridge = getAccountBridge(account);

    if (wcCallRequest.type === "broadcast") {
      const api = apiForCurrency(account.currency);
      result = await api.broadcastTransaction(wcCallRequest.data);

      log("walletconnect", "hash");
      log("walletconnect", result);

      return result;
    }

    if (wcCallRequest.type === "message") {
      log("walletconnect", "message to sign");
      log("walletconnect", (wcCallRequest.data: any));

      result = await withDevice(opts.device || "")((t) =>
        // $FlowFixMe (can't figure out MessageData | TypedMessageData)
        from(signMessage(t, wcCallRequest.data))
      ).toPromise();
      result = result.signature;

      log("walletconnect", "message signature");
      log("walletconnect", result);

      return result;
    }

    if (wcCallRequest.type === "transaction") {
      let operation = await bridge
        .signOperation({
          account,
          deviceId: opts.device || "",
          transaction: wcCallRequest.data,
        })
        .pipe(
          tap((e) => console.log(e)),
          first((e) => e.type === "signed"),
          map((e) => e.signedOperation)
        )
        .toPromise();

      log("walletconnect", "operation");
      log("walletconnect", operation);

      if (wcCallRequest.method === "sign") {
        return operation.signature;
      }

      operation = await bridge.broadcast({
        account,
        signedOperation: operation,
      });

      log("walletconnect", "operation broadcasted");
      log("walletconnect", (operation: any));

      return operation.hash;
    }

    throw new Error("JSON RPC method not supported");
  };

  connector.on("session_request", (error, payload) => {
    if (error) {
      throw error;
    }

    log("walletconnect", "session_request");
    log("walletconnect", payload);

    connector.approveSession({
      accounts: [account.freshAddress],
      chainId: account.currency.ethereumLikeInfo.chainId,
    });
  });

  connector.on("call_request", async (error, payload: WCPayload) => {
    if (error) {
      throw error;
    }

    try {
      const result = await handleCallRequest(payload);
      approveRequest(payload.id, result);
    } catch (e) {
      rejectRequest(payload.id, e.message);
    }
  });

  connector.on("connect", (error) => {
    if (error) {
      throw error;
    }

    log("walletconnect", "connected");
    log(
      "walletconnect",
      JSON.stringify(connector.session).replace(/"/g, `\\"`)
    );
  });
};

export default {
  description: "Create a walletconnect session",
  args: [
    ...scanCommonOpts,
    {
      name: "walletConnectURI",
      type: String,
      desc: "WallecConnect URI to use.",
    },
    {
      name: "walletConnectSession",
      type: String,
      desc: "WallecConnect Session to use.",
    },
    {
      name: "verbose",
      alias: "v",
      type: Boolean,
      desc: "verbose mode",
    },
    {
      name: "silent",
      type: Boolean,
      desc: "do not output the proxy logs",
    },
  ],
  job: (opts: Opts) =>
    Observable.create((o) => {
      const unsub = listen((l: any) => {
        if (opts.verbose) {
          o.next(l.type + ": " + l.message);
        } else if (!opts.silent && l.type === "walletconnect") {
          o.next(l.message);
        }
      });

      start(opts);

      return () => {
        unsub();
      };
    }),
};
