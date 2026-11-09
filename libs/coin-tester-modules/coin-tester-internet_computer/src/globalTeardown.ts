import { killLocalIcp } from "./localIcp";

export default async function globalTeardown(): Promise<void> {
  await killLocalIcp();
}
