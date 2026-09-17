#!/usr/bin/env node
import { run } from "@support/lint-base/runner";

run(new URL("../oxlint.config.mts", import.meta.url));
