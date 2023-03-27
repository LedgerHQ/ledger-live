#!/usr/bin/env node

const execa = require("execa");
const Listr = require("listr");

const tasks = new Listr(
  [
    {
      title: "Run eslint",
      task: async () => {
        try {
          const { stdout } = await execa("pnpm", ["lint"]);
          return stdout;
        } catch (error) {
          process.stderr.write(error.message);
          throw new Error("eslint test failed");
        }
      },
    },
    {
      title: "Run prettier check",
      task: async () => {
        try {
          const { stdout } = await execa("pnpm", ["prettier:check"]);
          return stdout;
        } catch (error) {
          process.stderr.write(error.message);
          throw new Error("prettier test failed");
        }
      },
    },
    {
      title: "Run typechecks",
      task: async () => {
        try {
          const { stdout } = await execa("pnpm", ["typecheck", __dirname]);
          return stdout;
        } catch (error) {
          process.stderr.write(error.message);
          throw new Error("typecheck test failed");
        }
      },
    },
  ],
  { concurrent: true, exitOnError: false },
);

tasks.run().catch(() => {
  process.exit(-1);
});
