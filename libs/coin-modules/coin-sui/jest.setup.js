import { expect } from "@jest/globals";

expect.addSnapshotSerializer({
  test: val => typeof val === "bigint",
  print: val => val.toString() + "n",
});
