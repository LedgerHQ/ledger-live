---
"live-mobile": patch
---

fix(iOS): Solana error after broadcast on WebSockets

We are adding a missing user-agent header on the websocket for iOS with RN
https://github.com/facebook/react-native/issues/28450
https://github.com/facebook/react-native/issues/30727
We need to use the interceptor as we don't control the code initiating the websocket
Updating the options passed in by the interceptor works fine
https://github.com/facebook/react-native/blob/3dfe22bd27429a43b4648c597b71f7965f31ca65/packages/react-native/Libraries/WebSocket/WebSocketInterceptor.js#L148-L163
Another solution could be to use pnpm to patch react native WebSocket linked below
https://github.com/facebook/react-native/blob/3dfe22bd27429a43b4648c597b71f7965f31ca65/packages/react-native/Libraries/WebSocket/WebSocket.js
But the interceptor seems lean enough and a simple hack vs patching a lib seems preferable
