import network from "../network";

export async function listOperations(addr: string): Promise<string> {
  //TODO: the accountId is used to map Operations to Live types.
  const fakeAccountId = "";
  const operations = await network.getOperations(fakeAccountId, addr);
  return operations[0].hash;
}
