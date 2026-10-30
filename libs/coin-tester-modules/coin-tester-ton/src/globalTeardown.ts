import { killLocalTon } from "./localTon";

export default async function globalTeardown(): Promise<void> {
  await killLocalTon();
}
