/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";

declare global {
  interface Window {
    ElectronWebview?: {
      postMessage(message: JsonRpcRequestMessage, targetOrigin?: string): void;
    };
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

// By default post to any origin
const DEFAULT_TARGET_ORIGIN = "*";
// By default timeout is 60 seconds
const DEFAULT_TIMEOUT_MILLISECONDS = 240000;

const JSON_RPC_VERSION = "2.0";

// The interface for the source of the events, typically the window.
export interface MinimalEventSourceInterface {
  addEventListener(eventType: "message", handler: (message: MessageEvent) => void): void;
  document?: MinimalEventSourceInterface;
}

// The interface for the target of our events, typically the injected api.
export interface MinimalEventTargetInterface {
  postMessage(message: JsonRpcRequestMessage, targetOrigin?: string): void;
}

/**
 * Options for constructing the iframe ethereum provider.
 */
export interface LedgerLiveEthereumProviderOptions {
  // The origin to communicate with. Default '*'
  targetOrigin?: string;
  // How long to time out waiting for responses. Default 60 seconds.
  timeoutMilliseconds?: number;

  // The event source. By default we use the window. This can be mocked for tests, or it can wrap
  // a different interface, e.g. workers.
  eventSource?: MinimalEventSourceInterface;

  // The event target. By default we use the window parent. This can be mocked for tests, or it can wrap
  // a different interface, e.g. workers.
  eventTarget?: MinimalEventTargetInterface;
}

/**
 * This is what we store in the state to keep track of pending promises.
 */
interface PromiseCompleter<TResult, TErrorData> {
  // A response was received (either error or result response).
  resolve(
    result: JsonRpcSucessfulResponseMessage<TResult> | JsonRpcErrorResponseMessage<TErrorData>,
  ): void;

  // An error with executing the request was encountered.
  reject(error: Error): void;
}

type MessageId = number | string | null;

interface JsonRpcRequestMessage<TParams = any> {
  type: "dapp";
  jsonrpc: "2.0";
  // Optional in the request.
  id?: MessageId;
  method: string;
  params?: TParams;
}

interface BaseJsonRpcResponseMessage {
  // Required but null if not identified in request
  id: MessageId;
  jsonrpc: "2.0";
}

interface JsonRpcSucessfulResponseMessage<TResult = any> extends BaseJsonRpcResponseMessage {
  result: TResult;
}

interface JsonRpcError<TData = any> {
  code: number;
  message: string;
  data?: TData;
}

interface JsonRpcErrorResponseMessage<TErrorData = any> extends BaseJsonRpcResponseMessage {
  error: JsonRpcError<TErrorData>;
}

type ReceivedMessageType =
  | JsonRpcRequestMessage
  | JsonRpcErrorResponseMessage
  | JsonRpcSucessfulResponseMessage;

/**
 * We return a random number between the 0 and the maximum safe integer so that we always generate a unique identifier,
 * across all communication channels.
 */
function getUniqueId(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// Kept to check the diff with all events and before
// export interface IFrameEthereumProvider {
//   on(event: "connect", handler: () => void): this;
//   on(event: "close", handler: (code: number, reason: string) => void): this;
//   on(event: "notification", handler: (result: any) => void): this;
//   on(event: "chainChanged", handler: (chainId: string) => void): this;
//   on(event: "networkChanged", handler: (networkId: string) => void): this;
//   on(event: "accountsChanged", handler: (accounts: string[]) => void): this;
// }

export interface RequestArguments {
  method: any;
  params?: any;
}

export interface ProviderConnectInfo {
  chainId: string;
}

export interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

export interface ProviderMessage {
  type: string;
  data: unknown;
}

export type Address = `0x${string}`;

export interface EIP1193Provider {
  on(event: "connect", listener: (info: ProviderConnectInfo) => void): this;
  on(event: "disconnect", listener: (error: ProviderRpcError) => void): this;
  /** @deprecated */
  on(event: "close", listener: (error: Error) => void): this;
  on(event: "chainChanged", listener: (chainId: string) => void): this;
  /** @deprecated */
  on(event: "networkChanged", listener: (networkId: string) => void): this;
  on(event: "accountsChanged", listener: (accounts: Address[]) => void): this;
  on(event: "message", listener: (message: ProviderMessage) => void): this;
  /** @deprecated */
  on(event: "notification", listener: (payload: ProviderMessage) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;

  request: (args: RequestArguments) => Promise<unknown>;
  /** @deprecated */
  send(...args: unknown[]): unknown;
  /** @deprecated */
  sendAsync(
    request: { method: string; params?: any[]; id?: MessageId },
    callback: (
      error: string | null,
      result: { method: string; params?: any[]; result: any } | any,
    ) => void,
  ): void;
}

/**
 * Represents an error in an RPC returned from the event source. Always contains a code and a reason. The message
 * is constructed from both.
 */
export class RpcError extends Error {
  public readonly isRpcError = true;

  public readonly code: number;
  public readonly reason: string;

  constructor(code: number, reason: string) {
    super(`${code}: ${reason}`);

    this.code = code;
    this.reason = reason;
  }
}

export class LedgerLiveEthereumProvider extends EventEmitter implements EIP1193Provider {
  /**
   * Always return this for currentProvider.
   */
  public get currentProvider() {
    return this;
  }

  isLedgerLive = true;
  isMetaMask = true;

  private enabled: Promise<string[]> | null = null;
  private readonly targetOrigin: string;
  private readonly timeoutMilliseconds: number;
  private readonly eventSource: MinimalEventSourceInterface;
  private readonly eventTarget?: MinimalEventTargetInterface;
  private readonly completers: {
    [id: string]: PromiseCompleter<any, any>;
  } = {};

  public constructor({
    targetOrigin = DEFAULT_TARGET_ORIGIN,
    timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
    eventSource = window,
    eventTarget,
  }: LedgerLiveEthereumProviderOptions = {}) {
    // Call super for `this` to be defined
    super();

    this.targetOrigin = targetOrigin;
    this.timeoutMilliseconds = timeoutMilliseconds;
    this.eventSource = eventSource;

    if (eventTarget) {
      this.eventTarget = eventTarget;
    } else if (window.ReactNativeWebView) {
      this.eventTarget = {
        postMessage(message, _targetOrigin) {
          return window.ReactNativeWebView?.postMessage(JSON.stringify(message));
        },
      };
    } else {
      this.eventTarget = window.ElectronWebview;
    }

    // Listen for messages from the event source.
    this.eventSource.addEventListener("message", this.handleEventSourceMessage);
    this.eventSource.document?.addEventListener("message", this.handleEventSourceMessage);
  }

  public isConnected = () => {
    return true;
  };

  /**
   * Helper method that handles transport and request wrapping
   * @param method method to execute
   * @param params params to pass the method
   * @param requestId jsonrpc request id
   */
  private async execute<TParams, TResult, TErrorData>(
    method: string,
    params?: TParams,
    requestId?: MessageId,
  ): Promise<JsonRpcSucessfulResponseMessage<TResult> | JsonRpcErrorResponseMessage<TErrorData>> {
    const id = requestId ? requestId : getUniqueId();
    const payload: JsonRpcRequestMessage = {
      type: "dapp",
      jsonrpc: JSON_RPC_VERSION,
      id,
      method,
      ...(typeof params === "undefined" ? null : { params }),
    };

    const promise = new Promise<
      JsonRpcSucessfulResponseMessage<TResult> | JsonRpcErrorResponseMessage<TErrorData>
    >((resolve, reject) => (this.completers[id] = { resolve, reject }));

    // Send the JSON RPC to the event source.
    this.eventTarget?.postMessage(payload, this.targetOrigin);

    // Delete the completer within the timeout and reject the promise.
    setTimeout(() => {
      if (this.completers[id]) {
        this.completers[id].reject(
          new Error(`RPC ID "${id}" timed out after ${this.timeoutMilliseconds} milliseconds`),
        );
        delete this.completers[id];
      }
    }, this.timeoutMilliseconds);

    return promise;
  }

  public async request(args: RequestArguments): Promise<unknown> {
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
  public async send<TParams = any[], TResult = any>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    const response = await this.execute<TParams, TResult, any>(method, params);

    if ("error" in response) {
      throw new RpcError(response.error.code, response.error.message);
    } else {
      return response.result;
    }
  }

  /**
   * Request the parent window to enable access to the user's web3 provider. Return accounts list immediately if already enabled.
   */
  public async enable(): Promise<string[]> {
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
  public async sendAsync(
    payload: { method: string; params?: any[]; id?: MessageId },
    callback: (
      error: string | null,
      result: { method: string; params?: any[]; result: any } | any,
    ) => void,
  ): Promise<void> {
    try {
      const result = await this.execute(payload.method, payload.params, payload.id);

      callback(null, result);
    } catch (error) {
      // @ts-expect-error we don't type narrow the unknown
      callback(error, null);
    }
  }

  /**
   * Handle a message on the event source.
   * @param event message event that will be processed by the provider
   */
  private handleEventSourceMessage = (event: MessageEvent) => {
    // We should probably check the origin in the event
    // To avoid receiving events from other sources
    const data = event.data;

    // No data to parse, skip.
    if (!data) {
      return;
    }

    try {
      const message = JSON.parse(data) as ReceivedMessageType;

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
    } catch (error) {
      console.log("Error parsing message from wallet: ", error);
    }
  };

  private emitNotification(result: any) {
    this.emit("notification", result);
  }

  private emitConnect() {
    // If the provider isn't enabled but it emits a connect event, assume that it's enabled and initialize
    // with an empty list of accounts.
    if (this.enabled === null) {
      this.enabled = Promise.resolve([]);
    }
    this.emit("connect");
  }

  private emitClose(code: number, reason: string) {
    this.emit("close", code, reason);
  }

  private emitChainChanged(chainId: string) {
    this.emit("chainChanged", chainId);
  }

  private emitNetworkChanged(networkId: string) {
    this.emit("networkChanged", networkId);
  }

  private emitAccountsChanged(accounts: string[]) {
    this.enabled = Promise.resolve(accounts);
    this.emit("accountsChanged", accounts);
  }
}
