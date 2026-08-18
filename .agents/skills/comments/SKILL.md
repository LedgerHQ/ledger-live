---
name: comments
description: Stop writing so many comments. Follow these suggestions instead!
---

# Comments in code

## 🧀 Avoid comments

Comments are _code smells_ because they go out-of-date, bloat context, and lead to confusion.

**Don't reference existing comments in the codebase – follow these rules**

- **Avoid adding comments** – always prefer good names (explainer variables, functions, tests)
- **Use test names to describe behaviour** – unit tests are living documentation
- **Good code explains itself** – don't add comments that duplicate what the code already conveys

## 💡 Treatments

When code isn't clear, make it clearer:

- Rename variables and functions to make comments unnecessary
- Extract variables and functions to improve readability
- Use assertions to explain behaviour

### Use test names to explain non-obvious details

**❌ Bad**

```ts
it("diffs the current value against resolved when targeted", () => {
  const { result } = renderHook(() => useJsonEditor(makeProps()));
  act(() => result.current.setDiffTarget("resolved"));
  // Current equals resolved → every line is unchanged.
  expect(result.current.diffJson.every((l) => l.state === "none")).toBe(true);
});
```

**✅ Good**

```ts
it("resets the state of every line when the diff is resolved", () => {
  const { result } = renderHook(() => useJsonEditor(makeProps()));
  act(() => result.current.setDiffTarget("resolved"));
  expect(result.current.diffJson.every((l) => l.state === "none")).toBe(true);
});
```

### Let code speak for itself

**❌ Bad**

```ts
/* Whether the filter trigger should be displayed */
showFilter: boolean;
```

**✅ Good**

```ts
showFilter: boolean;
```

### Replace comments with explainer variables

Move the comment into a variable name:

**Before**

```ts
// NB `app.trustchain` is an encrypted db path: while the app is password-locked it reads back
// as the ciphertext string. Importing it would regenerate member credentials and null the
// trustchain (LIVE-36130). IsUnlocked re-runs this thunk once the encryption key is set.
// `undefined` must still go through: that is the legitimate "nothing persisted" case.
if (typeof data === "string") return;
```

**After**

```ts
const dataIsEncrypted = typeof data === "string";
if (dataIsEncrypted) return;
```

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
