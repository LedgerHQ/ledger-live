#!/usr/bin/env node
import { run } from "@support/lint-base/runner";

// tools/actions/* commit their bundled output under build/, because GitHub Actions run it directly.
run(new URL("../oxlint.config.mts", import.meta.url), { ignore: ["**/build/**"] });
