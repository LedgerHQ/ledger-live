import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

function isVpnLike(name: string): boolean {
  return name.startsWith("utun") || name.startsWith("tun") || name.startsWith("vpn");
}

function isExternalIpv4(net: NetworkInterfaceInfo): boolean {
  return net.family === "IPv4" && !net.internal;
}

export function getLanIp(): string | null {
  const nets = networkInterfaces();
  const preferred = ["en0", "en1", "eth0"];

  for (const name of preferred) {
    for (const net of nets[name] ?? []) {
      if (isExternalIpv4(net)) return net.address;
    }
  }
  for (const [name, iface] of Object.entries(nets)) {
    if (isVpnLike(name)) continue;
    for (const net of iface ?? []) {
      if (isExternalIpv4(net)) return net.address;
    }
  }
  return null;
}
