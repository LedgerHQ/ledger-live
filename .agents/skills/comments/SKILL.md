---
name: comments
description: |
  Repo-wide conventions for code comments.
  Read this when reviewing or adding code comments.
---

# Comments in code

## 🧀 Avoid comments

Comments are a _code smell_ because:

- Comments can go out of date, leading to confusion and bugs
- They often don't add value beyond what the code already conveys
- Good code should explain itself

## 💡 Treatments

When code isn't clear we should try to make it clearer:

- Rename variables and functions to make comments unnecessary
- Extract variables and functions to improve readability
- Use assertions to explain the behaviour

## ☝️ When comments are necessary

When comments are necessary we should follow these guidelines:

- **Be concise**: Use as few words as possible to convey the necessary information
- **Prefer a link**: If the comment is explaining a workaround for a known issue, link to the issue or docs

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
