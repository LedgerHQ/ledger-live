// @flow
import "./live-common-setup";
import { ipcMain } from "electron";
import { Subscription } from "rxjs";
import {
  transportCloseChannel,
  transportExchangeChannel,
  transportExchangeBulkChannel,
  transportOpenChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportListenChannel,
  transportListenUnsubscribeChannel,
} from "~/config/transportChannels";
import {
  transportOpen,
  transportClose,
  transportExchange,
  transportExchangeBulk,
  transportExchangeBulkUnsubscribe,
  transportListen,
  transportListenUnsubscribe,
  responses,
} from "./transportHandler";

// route internal process messages to renderer
const internalHandlerPromise = (channel: string, f: (e: any) => void) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    let sub: Subscription | null = null;
    const handler = message => {
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // reject
          event.reply(replyChannel, { error: message.error });
        } else {
          // resolve
          event.reply(replyChannel, { data: message.data });
        }
        sub?.unsubscribe();
      }
    };
    sub = responses.subscribe(handler);
    f({ type: channel, data, requestId });
  });
};

// multi event version of internalHandler
const internalHandlerObservable = (channel: string, f: (e: any) => void) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    let sub: Subscription | null = null;
    const handler = (message: any) => {
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // error
          event.reply(replyChannel, { error: message.error });
        } else if (message.data) {
          // next
          event.reply(replyChannel, { data: message.data });
        } else {
          // complete
          event.reply(replyChannel, {});
          sub?.unsubscribe();
        }
      }
    };
    sub = responses.subscribe(handler);
    f({ type: channel, data, requestId });
  });
};

// simple event routing
const internalHandlerEvent = (channel: string, f: (_: any) => void) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    f({ type: channel, data, requestId });
  });
};

internalHandlerPromise(transportOpenChannel, transportOpen);
internalHandlerPromise(transportExchangeChannel, transportExchange);
internalHandlerPromise(transportCloseChannel, transportClose);
internalHandlerObservable(transportExchangeBulkChannel, transportExchangeBulk);
internalHandlerObservable(transportListenChannel, transportListen);
internalHandlerEvent(transportExchangeBulkUnsubscribeChannel, transportExchangeBulkUnsubscribe);
internalHandlerEvent(transportListenUnsubscribeChannel, transportListenUnsubscribe);
