interface Subcommand {
  name: string;
  describe: string;
  run: (argv: string[]) => Promise<void>;
}

const SUBCOMMANDS: Subcommand[] = [
  {
    name: "borrow",
    describe: "Open/close/repay/withdraw on-chain loans (Borrow API + Speculos)",
    // Loaded lazily so `pnpm e2e-cli` / `--help` / an unknown command never pull in the
    // Speculos + live-common signing chain.
    run: async argv => (await import("./borrow.js")).runBorrowCommand(argv),
  },
];

function usage(): string {
  const width = Math.max(...SUBCOMMANDS.map(c => c.name.length));
  const commands = SUBCOMMANDS.map(c => `  ${c.name.padEnd(width)}  ${c.describe}`).join("\n");
  return `Usage: pnpm e2e-cli <command> [options]\n\nCommands:\n${commands}`;
}

async function main(argv: string[]): Promise<void> {
  const [name, ...rest] = argv;

  if (!name || name === "--help" || name === "-h" || name === "help") {
    console.log(usage());
    if (!name) process.exitCode = 1;
    return;
  }

  const command = SUBCOMMANDS.find(c => c.name === name);
  if (!command) {
    console.error(`Unknown command '${name}'.\n\n${usage()}`);
    process.exitCode = 1;
    return;
  }

  await command.run(rest);
}

main(process.argv.slice(2))
  .then(() => process.exit(process.exitCode ?? 0))
  .catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
