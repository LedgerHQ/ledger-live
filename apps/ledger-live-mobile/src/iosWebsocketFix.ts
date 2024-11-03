import { Platform } from "react-native";
// @ts-expect-error WebSocketInterceptor is not exposed by react d.ts
import WebSocketInterceptor from "react-native/Libraries/WebSocket/WebSocketInterceptor.js";

// We are adding a missing user-agent header on the websocket for iOS with RN
// https://github.com/facebook/react-native/issues/28450
// https://github.com/facebook/react-native/issues/30727
// We need to use the interceptor as we don't control the code initiating the websocket
// Updating the options passed in by the interceptor works fine
// https://github.com/facebook/react-native/blob/3dfe22bd27429a43b4648c597b71f7965f31ca65/packages/react-native/Libraries/WebSocket/WebSocketInterceptor.js#L148-L163
// Another solution could be to use pnpm to patch react native WebSocket linked below
// https://github.com/facebook/react-native/blob/3dfe22bd27429a43b4648c597b71f7965f31ca65/packages/react-native/Libraries/WebSocket/WebSocket.js
// But the interceptor seems lean enough and a simple hack vs patching a lib seems preferable

if (Platform.OS === "ios") {
  WebSocketInterceptor.enableInterception();
  WebSocketInterceptor.setConnectCallback(
    (_url: string, _protocols: string[] | null, options?: { headers?: Record<string, string> }) => {
      if (options) {
        if (!options.headers) options.headers = {};
        if (!options.headers["User-Agent"]) options.headers["User-Agent"] = "ReactNative";
      }
    },
  );
}
