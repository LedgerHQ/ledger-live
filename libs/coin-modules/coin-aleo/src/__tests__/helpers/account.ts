export async function getPristineAccount(): Promise<{ address: string; viewKey: string }> {
  const { Account } = await import("@provablehq/sdk/testnet.js");
  const account = new Account();
  try {
    return {
      address: account.address().toString(),
      viewKey: account.viewKey().toString(),
    };
  } finally {
    account.destroy();
  }
}
