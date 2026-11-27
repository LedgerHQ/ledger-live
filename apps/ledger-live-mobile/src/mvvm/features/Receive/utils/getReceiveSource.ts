import { navigationRef } from "~/rootnavigation";

export const getReceiveSource = (): string | undefined =>
  navigationRef.current?.getCurrentRoute()?.name;
