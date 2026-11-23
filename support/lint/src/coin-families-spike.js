// Throwaway spike plugin: proves the oxlint JS plugin APIs the coin-family rules would need.
// Not meant to be merged as is.
import fs from "node:fs";

const FIXTURE = /__spike_fixture__\.tsx?$/;
const DIRECTIVE = /(oxlint|eslint)-disable/;

// 4.f: external data loaded once, at module load, relative to this file.
const IDS = JSON.parse(
  fs.readFileSync(new URL("./coin-families-spike-ids.json", import.meta.url), "utf8"),
);

/** @param {any} context @param {string} message @param {any} node */
function say(context, message, node) {
  if (FIXTURE.test(context.filename ?? "")) context.report({ message, node });
}

const noop = {
  createOnce() {
    return { Program() {} };
  },
};

// 4.a: options read in `before`, report from `after` and from `Program:exit`.
const optionsProbe = {
  meta: { schema: [{ type: "object", additionalProperties: true }] },
  createOnce(context) {
    let seen = "unset";
    let program = null;
    return {
      before() {
        seen = JSON.stringify(context.options);
      },
      Program(node) {
        program = node;
      },
      "Program:exit"(node) {
        say(context, `[exit] options in before = ${seen}`, node);
      },
      after() {
        say(context, `[after] options in before = ${seen}`, program);
      },
    };
  },
};

// 4.d: directives as comments.
const commentsProbe = {
  createOnce(context) {
    return {
      Program(node) {
        const all = context.sourceCode.getAllComments();
        const dirs = all.filter((c) => DIRECTIVE.test(c.value));
        say(context, `[comments] total=${all.length} directives=${dirs.length}`, node);
        for (const c of dirs) {
          if (/coin-families\//.test(c.value)) {
            say(context, `[comments] directive names a coin-families rule: ${c.value.trim()}`, c);
          }
        }
      },
    };
  },
};

// 4.f: the id list loaded at module level.
const dataProbe = {
  createOnce(context) {
    return {
      Program(node) {
        say(context, `[data] ${IDS.length} ids, first=${IDS[0]}`, node);
      },
    };
  },
};

// Realistic cost: the node types rules A/B/C/D would visit.
const realistic = {
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        const v = node.source?.value;
        if (typeof v === "string" && v.includes("/families/")) {
          say(context, `[real] family import ${v}`, node);
        }
      },
      CallExpression(node) {
        const c = node.callee;
        if (c?.type === "MemberExpression" && c.property?.name === "includes") {
          const a = node.arguments?.[0];
          if (a?.type === "Literal" && IDS.includes(a.value)) say(context, "[real] id", node);
        }
      },
      BinaryExpression(node) {
        if (node.right?.type === "Literal" && IDS.includes(node.right.value)) {
          say(context, "[real] id compare", node);
        }
      },
      SwitchCase(node) {
        if (node.test?.type === "Literal" && IDS.includes(node.test.value)) {
          say(context, "[real] id case", node);
        }
      },
    };
  },
};

export default {
  meta: { name: "coin-families" },
  rules: {
    noop,
    "options-probe": optionsProbe,
    "comments-probe": commentsProbe,
    "data-probe": dataProbe,
    realistic,
  },
};
