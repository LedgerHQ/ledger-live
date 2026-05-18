"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { findViolations } = require("./validate");

/**
 * @param {Array<{name: string, tags: string[]}>} projects
 * @param {Array<{source: string, target: string}>} edges
 */
function buildGraph(projects, edges) {
  const nodes = Object.fromEntries(projects.map(p => [p.name, { data: { tags: p.tags } }]));
  const dependencies = Object.fromEntries(
    projects.map(p => [
      p.name,
      edges.filter(e => e.source === p.name).map(e => ({ target: e.target })),
    ]),
  );
  return { nodes, dependencies };
}

test("shared -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("shared -> domain is forbidden (leaf-layer rule)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  assert.deepEqual(v[0].sourceTags, ["scope:shared"]);
  assert.equal(v[0].target, "b");
});

test("domain -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("domain-entity -> domain-api is forbidden (intra-domain rule)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-entity"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["type:domain-entity"]);
  assert.equal(v[0].target, "b");
});

test("domain-api -> domain-entity is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("domain-entity -> domain-entity is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-entity"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> domain is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> legacy libs is forbidden (features must stay in new arch)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:libs", "scope:libs-non-ui"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["scope:features"]);
});

test("legacy source (no new-arch tags) is unconstrained", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:libs", "scope:libs-non-ui"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("app source is unconstrained (apps can import anything during migration)", () => {
  const graph = buildGraph(
    [
      { name: "app", tags: ["scope:apps", "type:app-desktop"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
      { name: "c", tags: ["scope:features"] },
    ],
    [
      { source: "app", target: "b" },
      { source: "app", target: "c" },
    ],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("external deps (target absent from graph.nodes) are skipped", () => {
  const graph = {
    nodes: { a: { data: { tags: ["scope:shared"] } } },
    dependencies: { a: [{ target: "npm:some-package" }, { target: "npm:another" }] },
  };
  assert.deepEqual(findViolations(graph), []);
});

test("multiple violations are all reported", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:domain"] },
      { name: "c", tags: ["scope:features"] },
    ],
    [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 2);
  assert.ok(v.every(x => x.sourceName === "a" && x.sourceTags.includes("scope:shared")));
});

test("multi-tag source emits one deduped violation per edge", () => {
  // type:domain-api source also carries scope:domain — both rules match,
  // both forbid scope:features targets. Should produce ONE violation
  // listing both source tags.
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:features"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  assert.equal(v[0].target, "b");
  assert.ok(v[0].sourceTags.includes("scope:domain"));
  assert.ok(v[0].sourceTags.includes("type:domain-api"));
});

test("feature-platform -> feature-platform is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:features", "type:feature-platform"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> feature-flow is forbidden (platform sits below flow)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:features", "type:feature-flow"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  // scope:features rule is satisfied (target carries scope:features) — only
  // type:feature-platform fails, so just that tag accrues to the violation.
  assert.deepEqual(v[0].sourceTags, ["type:feature-platform"]);
});

test("feature-flow -> feature-platform is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-flow"] },
      { name: "b", tags: ["scope:features", "type:feature-platform"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-flow -> feature-flow is allowed (sibling flows can compose)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-flow"] },
      { name: "b", tags: ["scope:features", "type:feature-flow"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> domain / shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
      { name: "c", tags: ["scope:shared"] },
    ],
    [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> legacy libs is forbidden", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:libs", "scope:libs-non-ui"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  // Both scope:features and type:feature-platform rules fire and both fail —
  // findViolations dedupes per edge and accumulates both source tags.
  assert.ok(v[0].sourceTags.includes("scope:features"));
  assert.ok(v[0].sourceTags.includes("type:feature-platform"));
});

test("missing tags default to empty array (no crash)", () => {
  const graph = {
    nodes: {
      a: { data: {} },
      b: {},
    },
    dependencies: { a: [{ target: "b" }] },
  };
  // neither node carries tags; no rule fires
  assert.deepEqual(findViolations(graph), []);
});
