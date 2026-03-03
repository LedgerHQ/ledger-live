import { Observable } from "rxjs";
import { createProxyContext } from "./createProxyContext";
import { createProxyServer } from "./createProxyServer";
import { startDeviceDiscovery } from "./startDeviceDiscovery";
import { startLogBridge } from "./startLogBridge";
import type { ProxyJobOpts } from "./types";

export const createProxyJob = ({
  silent,
  verbose,
  port,
}: Partial<ProxyJobOpts>): Observable<string> =>
  new Observable(observer => {
    const runtimeContext = createProxyContext({ port });
    const stopLogBridge = startLogBridge({ silent, verbose }, line => observer.next(line));
    const stopDeviceDiscovery = startDeviceDiscovery(runtimeContext);
    let wss: ReturnType<typeof createProxyServer>;
    try {
      wss = createProxyServer(runtimeContext);
    } catch (error) {
      stopLogBridge();
      stopDeviceDiscovery();
      observer.error(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    return () => {
      stopLogBridge();
      stopDeviceDiscovery();
      wss.close();
    };
  });
