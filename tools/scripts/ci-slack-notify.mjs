// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import { runNotify } from "./ci-slack-notify/run.mjs";

runNotify({ env: process.env }).catch(err => {
  console.error(err);
  process.exit(1);
});
