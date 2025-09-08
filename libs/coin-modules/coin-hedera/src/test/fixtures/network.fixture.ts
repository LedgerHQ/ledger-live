import type network from "@ledgerhq/live-network";

export const getMockResponse = (data: any): Awaited<ReturnType<typeof network>> => ({
  data,
  status: 200,
});
