// This tests that no "Ledger Live Internal" thread have leaked in the system

const ps = require("ps-node");

function checkProcesses() {
  ps.lookup({}, function(err, list) {
    if (err) {
      throw new Error(err);
    }
    const processes = list.filter(
      p =>
        p.arguments.includes("Ledger Live Internal") ||
        (p.arguments.includes("Ledger") &&
          p.arguments.includes("Live") &&
          p.arguments.includes("Internal")),
    );

    if (processes.length === 0) {
      process.exit(0);
    } else {
      console.error(
        processes.length +
          " instances of Ledger Live Internal are still running in background! " +
          processes.map(p => p.pid).join(", ") +
          "\n" +
          "this probably means a bug exists in Ledger Live at cleaning up the processes on close.",
      );
      process.exit(1);
    }
  });
}

checkProcesses();
