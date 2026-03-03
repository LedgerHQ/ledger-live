import os from "os";

export function listProxyUrls(port: string): string[] {
  const ifaces = os.networkInterfaces();
  const ips = Object.keys(ifaces).reduce<string[]>((acc, ifname) => {
    const addrs = ifaces[ifname];
    if (!addrs) return acc;
    return acc.concat(
      addrs.filter(iface => iface.family === "IPv4" && !iface.internal).map(iface => iface.address),
    );
  }, []);

  return ["localhost", ...ips].map(ip => `ws://${ip}:${port}`);
}
