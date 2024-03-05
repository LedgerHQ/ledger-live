/* eslint-disable prefer-rest-params */
function codeToInject() {
  /**
   * The following line is a hermes directive that allows
   * Function.prototype.toString() to return clear stringified code that can
   * thus be injected in a webview.
   *
   * ⚠️ IN DEBUG this doesn't work until you hot reload this file (just save the file and it will work)
   * see https://github.com/facebook/hermes/issues/612
   *  */

  "show source";

  function EventEmitter() {
    // Keep this empty so it's easier to inherit from
    // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
  }

  EventEmitter.prototype = {
    on: function (name, callback, ctx) {
      const e = this.e || (this.e = {});

      (e[name] || (e[name] = [])).push({
        fn: callback,
        ctx: ctx,
      });

      return this;
    },

    once: function (name, callback, ctx) {
      const self = this;
      function listener() {
        self.off(name, listener);
        callback.apply(ctx, arguments);
      }

      listener._ = callback;
      return this.on(name, listener, ctx);
    },

    emit: function (name) {
      const data = [].slice.call(arguments, 1);
      const evtArr = ((this.e || (this.e = {}))[name] || []).slice();
      let i = 0;
      const len = evtArr.length;

      for (i; i < len; i++) {
        evtArr[i].fn.apply(evtArr[i].ctx, data);
      }

      return this;
    },

    removeListener: function (name, callback) {
      const e = this.e || (this.e = {});
      const evts = e[name];
      const liveEvents = [];

      if (evts && callback) {
        for (let i = 0, len = evts.length; i < len; i++) {
          if (evts[i].fn !== callback && evts[i].fn._ !== callback) liveEvents.push(evts[i]);
        }
      }

      // Remove event from queue to prevent memory leak
      // Suggested by https://github.com/lazd
      // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

      liveEvents.length ? (e[name] = liveEvents) : delete e[name];

      return this;
    },
  };

  // By default post to any origin
  const DEFAULT_TARGET_ORIGIN = "*";
  // By default timeout is 60 seconds
  const DEFAULT_TIMEOUT_MILLISECONDS = 240000;

  const JSON_RPC_VERSION = "2.0";

  /**
   * We return a random number between the 0 and the maximum safe integer so that we always generate a unique identifier,
   * across all communication channels.
   */
  function getUniqueId() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  /**
   * Represents an error in an RPC returned from the event source. Always contains a code and a reason. The message
   * is constructed from both.
   */
  class RpcError extends Error {
    isRpcError = true;
    code;
    reason;

    constructor(code, reason) {
      super(`\${code}: \${reason}`);

      this.code = code;
      this.reason = reason;
    }
  }

  class LedgerLiveEthereumProvider extends EventEmitter {
    /**
     * Always return this for currentProvider.
     */
    get currentProvider() {
      return this;
    }

    isRabby = true;
    isMetaMask = true;

    enabled = null;
    targetOrigin;
    timeoutMilliseconds;
    eventSource;
    eventTarget;
    completers = {};

    constructor({
      targetOrigin = DEFAULT_TARGET_ORIGIN,
      timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
      eventSource = window,
      eventTarget = window.ReactNativeWebView,
    } = {}) {
      super();

      this.targetOrigin = targetOrigin;
      this.timeoutMilliseconds = timeoutMilliseconds;
      this.eventSource = eventSource;
      this.eventTarget = eventTarget;

      // Listen for messages from the event source.
      this.eventSource.addEventListener("message", this.handleEventSourceMessage);
    }

    isConnected = () => {
      return true;
    };

    /**
     * Helper method that handles transport and request wrapping
     * @param method method to execute
     * @param params params to pass the method
     * @param requestId jsonrpc request id
     */
    async execute(method, params, requestId) {
      const id = requestId ? requestId : getUniqueId();
      const payload = {
        type: "dapp",
        jsonrpc: JSON_RPC_VERSION,
        id,
        method,
        ...(typeof params === "undefined" ? null : { params }),
      };

      const promise = new Promise((resolve, reject) => (this.completers[id] = { resolve, reject }));

      // Send the JSON RPC to the event source.
      this.eventTarget.postMessage(JSON.stringify(payload), this.targetOrigin);

      // Delete the completer within the timeout and reject the promise.
      setTimeout(() => {
        if (this.completers[id]) {
          this.completers[id].reject(
            new Error(`RPC ID "\${id}" timed out after \${this.timeoutMilliseconds} milliseconds`),
          );
          delete this.completers[id];
        }
      }, this.timeoutMilliseconds);

      return promise;
    }

    async request(args) {
      const response = await this.execute(args.method, args.params);

      if ("error" in response) {
        throw new RpcError(response.error.code, response.error.message);
      } else {
        return response.result;
      }
    }

    /**
     * Send the JSON RPC and return the result.
     * @param method method to send to the parent provider
     * @param params parameters to send
     */
    async send(method, params) {
      const response = await this.execute(method, params);

      if ("error" in response) {
        throw new RpcError(response.error.code, response.error.message);
      } else {
        return response.result;
      }
    }

    /**
     * Request the parent window to enable access to the user's web3 provider. Return accounts list immediately if already enabled.
     */
    async enable() {
      if (this.enabled === null) {
        const promise = (this.enabled = this.send("enable").catch(error => {
          // Clear this.enabled if it's this promise so we try again next call.
          // this.enabled might be set from elsewhere if, e.g. the accounts changed event is emitted
          if (this.enabled === promise) {
            this.enabled = null;
          }
          // Rethrow the error.
          throw error;
        }));
      }

      return this.enabled;
    }

    /**
     * Backwards compatibility method for web3.
     * @param payload payload to send to the provider
     * @param callback callback to be called when the provider resolves
     */
    async sendAsync(payload, callback) {
      try {
        const result = await this.execute(payload.method, payload.params, payload.id);

        callback(null, result);
      } catch (error) {
        callback(error, null);
      }
    }

    /**
     * Handle a message on the event source.
     * @param event message event that will be processed by the provider
     */
    handleEventSourceMessage = event => {
      const data = event.data;

      // No data to parse, skip.
      if (!data) {
        return;
      }

      try {
        const message = JSON.parse(data);

        // Always expect jsonrpc to be set to '2.0'
        if (message.jsonrpc !== JSON_RPC_VERSION) {
          return;
        }

        // If the message has an ID, it is possibly a response message
        if (typeof message.id !== "undefined" && message.id !== null) {
          const completer = this.completers["" + message.id];

          // True if we haven't timed out and this is a response to a message we sent.
          if (completer) {
            // Handle pending promise
            if ("error" in message || "result" in message) {
              completer.resolve(message);
            } else {
              completer.reject(
                new Error("Response from provider did not have error or result key"),
              );
            }

            delete this.completers[message.id];
          }
        }

        // If the method is a request from the parent window, it is likely a subscription.
        if ("method" in message) {
          switch (message.method) {
            case "notification":
              this.emitNotification(message.params);
              break;

            case "connect":
              this.emitConnect();
              break;

            case "close":
              this.emitClose(message.params[0], message.params[1]);
              break;

            case "chainChanged":
              this.emitChainChanged(message.params[0]);
              break;

            case "networkChanged":
              this.emitNetworkChanged(message.params[0]);
              break;

            case "accountsChanged":
              this.emitAccountsChanged(message.params[0]);
              break;
          }
        }
      } catch (error) {
        console.error("Error parsing message from wallet: ", error);
      }
    };

    emitNotification(result) {
      this.emit("notification", result);
    }

    emitConnect() {
      // If the provider isn't enabled but it emits a connect event, assume that it's enabled and initialize
      // with an empty list of accounts.
      if (this.enabled === null) {
        this.enabled = Promise.resolve([]);
      }
      this.emit("connect");
    }

    emitClose(code, reason) {
      this.emit("close", code, reason);
    }

    emitChainChanged(chainId) {
      this.emit("chainChanged", chainId);
    }

    emitNetworkChanged(networkId) {
      this.emit("networkChanged", networkId);
    }

    emitAccountsChanged(accounts) {
      this.enabled = Promise.resolve(accounts);
      this.emit("accountsChanged", accounts);
    }
  }

  function onPageLoad() {
    const ethereumProvider = new LedgerLiveEthereumProvider();
    window.ethereum = ethereumProvider;

    // Metamask legacy compat (not sure we want to keep this)
    window.web3 = { currentProvider: ethereumProvider };

    const announceEip6963Provider = provider => {
      const info = {
        uuid: "05146cb9-6ba2-4741-981c-f52f6033e8a2",
        name: "Ledger Live Wallet",
        icon: "https://play-lh.googleusercontent.com/mHjR3KaAMw3RGA15-t8gXNAy_Onr4ZYUQ07Z9fG2vd51IXO5rd7wtdqEWbNMPTgdqrk",
        rdns: "com.ledger",
      };

      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: Object.freeze({ info, provider }),
        }),
      );
    };

    window.addEventListener("eip6963:requestProvider", () => {
      announceEip6963Provider(ethereumProvider);
    });

    announceEip6963Provider(ethereumProvider);

    window.dispatchEvent(new Event("ethereum#initialized"));
  }

  window.addEventListener("load", onPageLoad);
}

function getFunctionBody(str: string) {
  return str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

export const INJECTED_JAVASCRIPT = `
${getFunctionBody(codeToInject.toString())}

true; // note: this is required, or you'll sometimes get silent failures
`;
