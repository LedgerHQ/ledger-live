/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransformStream } from "web-streams-polyfill";

// This polyfill is required by msw/native
// https://github.com/mswjs/msw/issues/2367

const globalAny = global as any;

if (typeof globalAny.TransformStream === "undefined") {
  globalAny.TransformStream = TransformStream;
}

if (typeof globalAny.Document === "undefined") {
  globalAny.Document = class Document {};
}

if (typeof globalAny.Event === "undefined") {
  globalAny.Event = function Event(type: string, eventInitDict: any = {}) {
    this.type = type;
    this.bubbles = eventInitDict.bubbles || false;
    this.cancelable = eventInitDict.cancelable || false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
    this.defaultPrevented = false;
    this.isTrusted = false;

    this.preventDefault = function () {
      this.defaultPrevented = true;
    };
  };
}

if (typeof globalAny.EventTarget === "undefined") {
  globalAny.EventTarget = function EventTarget() {
    this.listeners = {};
  };

  globalAny.EventTarget.prototype.addEventListener = function (type: string, callback: any) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  };

  globalAny.EventTarget.prototype.removeEventListener = function (type: string, callback: any) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((cb: any) => cb !== callback);
  };

  globalAny.EventTarget.prototype.dispatchEvent = function (event: any) {
    if (!this.listeners[event.type]) return true;
    this.listeners[event.type].forEach((cb: any) => cb.call(this, event));
    return !event.defaultPrevented;
  };
}

if (typeof globalAny.MessageEvent === "undefined") {
  globalAny.MessageEvent = function MessageEvent(type: string, eventInitDict: any = {}) {
    this.type = type;
    this.data = eventInitDict.data || null;
    this.origin = eventInitDict.origin || "";
    this.lastEventId = eventInitDict.lastEventId || "";
    this.source = eventInitDict.source || null;
    this.ports = eventInitDict.ports || [];
  };
}

if (typeof BroadcastChannel === "undefined") {
  globalAny.BroadcastChannel = class BroadcastChannel extends globalAny.EventTarget {
    channelName: string;
    _subscribers: any[];

    constructor(channelName: string) {
      super();
      this.channelName = channelName;
      this._subscribers = [];
    }

    postMessage(message: any) {
      const event = new globalAny.MessageEvent("message", {
        data: message,
      });

      setTimeout(() => {
        this.dispatchEvent(event);
      }, 0);
    }

    close() {
      this._subscribers = [];
    }
  };
}
