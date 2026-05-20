import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SkillEvalSuite = {
  prompt: string;
  vars?: Record<string, unknown>;
  expected: Array<{ description: string; assert: unknown[] }>;
};

const suitePath = process.env.EVAL_SUITE;
if (!suitePath) {
  throw new Error("EVAL_SUITE env var is required (path to a skill's evals.json)");
}

const suite = JSON.parse(readFileSync(resolve(suitePath), "utf-8")) as SkillEvalSuite;

export default suite.expected.map((e) => ({
  description: e.description,
  vars: { ...(suite.vars ?? {}), prompt: suite.prompt },
  assert: e.assert,
}));
