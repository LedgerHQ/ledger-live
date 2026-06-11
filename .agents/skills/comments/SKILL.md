---
name: comments
description: |
  Repo-wide conventions for code comments.
  Read this when reviewing or adding code comments.
---

# Comments in code

## 🧀 Avoid comments

Comments are a _code smell_ because comments can go out of date, leading to confusion and bugs.

**Reference this guidance rather than the codebase.**

- **Avoid adding comments** – always prefer good naming
- **Use test names to describe behaviour** – unit tests are living documentation
- **Good code explains itself** – don't add comments that duplicate what the code already conveys

## 💡 Treatments

When code isn't clear we should try to make it clearer:

- Rename variables and functions to make comments unnecessary
- Extract variables and functions to improve readability
- Use assertions to explain the behaviour

## ☝️ When comments are necessary

When comments are necessary we should follow these guidelines:

- **Be concise**: Use as few words as possible to convey the necessary information.
- **Use JSDocs**: Only when describing a shared function.
- **Prefer a link**: If the comment is explaining a workaround for a known issue, link to the issue or docs.

**❌ Bad**

```yaml
# pnpm patches add 'patch_hash=HASH' to virtual store paths, which prefab 2.1.0
# (introduced via AGP 8.11) misparses as an option flag due to a clikt bug that splits
# positional path arguments at '='. Pinning prefab to 2.0.0 in gradle.properties avoids
# this; keeping path segments ≤ 80 chars shortens virtual-store paths to reduce the
# likelihood of triggering prefab path-parsing issues as an additional safeguard.
android.prefab.version=2.0.0
virtual-store-dir-max-length=80
```

**✅ Better**

```yaml
# Workaround for Prefab 2.1.0/Clikt bug
# See: https://github.com/google/prefab/issues/187
android.prefab.version=2.0.0
virtual-store-dir-max-length=80
```

## 🙅 When comments are not necessary

Use test names rather than comments to explain none-obvious details:

**❌ Bad**

```ts
it("diffs the current value against resolved when targeted", () => {
  const { result } = renderHook(() => useJsonEditor(makeProps()));
  act(() => result.current.setDiffTarget("resolved"));
  // Current equals resolved → every line is unchanged.
  expect(result.current.diffJson.every(l => l.state === "none")).toBe(true);
});
```

**✅ Good**

```ts
it("resets the state of every line when the diff is resolved", () => {
  const { result } = renderHook(() => useJsonEditor(makeProps()));
  act(() => result.current.setDiffTarget("resolved"));
  expect(result.current.diffJson.every(l => l.state === "none")).toBe(true);
});
```

Avoid clearly unnecessary comments:

**❌ Bad**

```ts
/* Whether the filter trigger should be displayed */
showFilter: boolean;
```

**✅ Good**

```ts
showFilter: boolean;
```
