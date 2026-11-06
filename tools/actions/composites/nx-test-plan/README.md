# Nx package test plan

Plans the shards of the PR's **Test Packages** job from the affected Nx projects. Most PRs get one shard. A change that affects many heavy projects is split across more, up to `max-shards`.

Only projects tagged `scope:libs`, `scope:features`, `scope:shared`, `scope:domain`, `scope:devtools` or `scope:support` are planned, with the same rules as the lanes they replace:

- every planned project is lint-, typecheck- and format-checked
- `coverage` runs where the project has it, except UI libs (`scope:libs-ui`), which have their own job
- libs without `coverage` run `test`
- domain projects with `check-export-rules` run it

A project weighs its test file count plus 10 (lint, typecheck and Jest start-up). Shards are added once the total passes `max-weight-per-shard`, and projects go heaviest first onto the lightest shard.

The composite does not check out or set up the workspace. Run it after `nx-affected-packages`, in the same job.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `affected` | Yes | | Newline-separated affected project names |
| `max-weight-per-shard` | No | `2500` | Weight one shard takes before another is added |
| `max-shards` | No | `4` | Upper bound on the number of shards |

## Outputs

| Output | Description |
| --- | --- |
| `shards` | Number of shards, `0` when nothing in the package scopes is affected |
| `matrix` | `{"include":[{shard, weight, projects, coverage, test, export_rules, roots}]}`, comma-separated project names and space-separated roots |

## Run locally

```sh
AFFECTED="$(pnpm nx show projects --affected --base origin/develop)" node tools/actions/composites/nx-test-plan/plan-test-shards.js
node --test tools/actions/composites/nx-test-plan/plan-test-shards.test.js
```
