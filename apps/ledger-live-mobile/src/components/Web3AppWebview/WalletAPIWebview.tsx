import React, { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView as RNWebView } from "react-native-webview";
import Config from "react-native-config";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebView } from "./helpers";
import { NetworkError } from "./NetworkError";
import { DEFAULT_MULTIBUY_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";

const INJECTED_JAVASCRIPT = `
function EventEmitter () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

EventEmitter.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
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
    super(\`\${code}: \${reason}\`);

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
  async execute(
    method,
    params,
    requestId,
  ) {
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
          new Error(\`RPC ID "\${id}" timed out after \${this.timeoutMilliseconds} milliseconds\`),
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
  async send(
    method,
    params,
  ) {
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
  async sendAsync(
    payload,
    callback,
  ) {
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
  handleEventSourceMessage = (event) => {
    const data = event.data;

    // No data to parse, skip.
    if (!data) {
      return;
    }

    const message = data;

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
          completer.reject(new Error("Response from provider did not have error or result key"));
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

  const announceEip6963Provider = (provider) => {
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

true; // note: this is required, or you'll sometimes get silent failures
`;

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      inputs = {},
      customHandlers,
      onStateChange,
      allowsBackForwardNavigationGestures = true,
    },
    ref,
  ) => {
    const { onMessage, onLoadError, webviewProps, webviewRef } = useWebView(
      {
        manifest,
        inputs,
        customHandlers,
      },
      ref,
      onStateChange,
    );

    const reloadWebView = () => {
      webviewRef.current?.reload();
    };

    const javaScriptCanOpenWindowsAutomatically = manifest.id === DEFAULT_MULTIBUY_APP_ID;

    return (
      <RNWebView
        ref={webviewRef}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        onMessage={onMessage}
        onError={onLoadError}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
        renderError={() => <NetworkError handleTryAgain={reloadWebView} />}
        testID="wallet-api-webview"
        allowsUnsecureHttps={__DEV__ && !!Config.IGNORE_CERTIFICATE_ERRORS}
        javaScriptCanOpenWindowsAutomatically={javaScriptCanOpenWindowsAutomatically}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        {...webviewProps}
      />
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
