export async function promptHidden(label: string): Promise<string> {
  const envPass = process.env.WALLET_PASS;
  if (envPass !== undefined) return envPass;

  if (process.stdin.isTTY) {
    process.stderr.write(label);
    return new Promise((resolve, reject) => {
      let value = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = (ch: string) => {
        if (ch === "\r" || ch === "\n") {
          teardown();
          resolve(value);
        } else if (ch === "") {
          teardown();
          reject(new Error("Cancelled"));
        } else if (ch === "" || ch === "\b") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      };

      const teardown = () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stderr.write("\n");
      };

      process.stdin.on("data", onData);
    });
  }

  throw new Error(
    "Password required but no TTY available and WALLET_PASS is not set.\n" +
      "Inject it from your OS keychain before running the command:\n" +
      "  macOS : WALLET_PASS=$(security find-generic-password -a default -s ledger-cli -w) wallet-cli ...\n" +
      "  Linux : WALLET_PASS=$(secret-tool lookup service ledger-cli account default) wallet-cli ...\n" +
      "  Win   : $env:WALLET_PASS=(Get-StoredCredential -Target ledger-cli).GetNetworkCredential().Password",
  );
}
