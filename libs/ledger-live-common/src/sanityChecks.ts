import React from "react";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
export function checkLibs(
  libs: Partial<{
    React: typeof React;
    log: typeof log;
    Transport: typeof Transport;
  }>,
): void {
  check(libs.log, log, "@ledgerhq/logs");
  check(libs.Transport, Transport, "@ledgerhq/hw-transport");
  check(libs.React, React, "react");

  function check(remoteInst, localInst, pkg) {
    if (remoteInst && remoteInst !== localInst) {
      console.warn(`
      ______
      | |__| |
      |  ()  |
      |______|

${pkg} NPM package dup detected! You must \`pnpm why -r ${pkg}\` and update the versions accordingly.

`);
      throw new Error("duplicated " + pkg + " library");
    }
  }
}
