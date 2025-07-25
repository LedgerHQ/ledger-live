export default class WebSocketStub {
  readyState = 1;
  onopen = () => {};
  onmessage = (_: any) => {};
  onerror = (_: any) => {};
  onclose = () => {};
  send(_data: any) {}
  close() {}
  addEventListener(_evt: string, _cb: any) {}
  removeEventListener(_evt: string, _cb: any) {}
}
