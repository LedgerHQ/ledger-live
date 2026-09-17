#!/usr/bin/env node
import { run } from "../runner.mjs";

run(new URL("../oxlint.config.mts", import.meta.url));
