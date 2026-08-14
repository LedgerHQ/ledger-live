# @support/generate-config

CLI that reads a package's `tsconfig.config.json`, merges the declared config fragments, and writes the generated tsconfig files to disk.

## Why

TypeScript's `extends` cannot merge arrays or share `references`. A generator that runs before `tsc` is the only way to compose configs without these limitations. See `support/README.md` for the full rationale.

## Usage

Add `tsconfig.config.json` to your package:

```json
{
  "extends": [
    "@support/tsconfigs/base",
    "@support/tsconfigs/web-native"
  ]
}
```

Include package-level overrides alongside `extends`:

```json
{
  "extends": [
    "@support/tsconfigs/base",
    "@support/tsconfigs/jest",
    "@support/tsconfigs/web-native"
  ],
  "compilerOptions": {
    "paths": {
      "custom/*": ["./custom/*"]
    }
  }
}
```

Run from the package root:

```sh
node {workspaceRoot}/support/generate-config/generator.js
```

Or via the Nx target (preferred):

```sh
nx run my-package:generate-tsconfig
```

## Generated files

The generator writes `tsconfig.json` always. If any declared feature contributes a `web` or `native` section, `tsconfig.web.json` and `tsconfig.native.json` are written as well.

Each generated file begins with a `"//"` key pointing back to `tsconfig.config.json`. Do not edit generated files directly.

## Nx wiring

Add to `project.json`:

```json
{
  "targets": {
    "generate-tsconfig": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node {workspaceRoot}/support/generate-config/generator.js",
        "cwd": "{projectRoot}"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/tsconfig.config.json",
        "{workspaceRoot}/support/tsconfigs/fragments/**/*"
      ],
      "outputs": [
        "{projectRoot}/tsconfig.json",
        "{projectRoot}/tsconfig.web.json",
        "{projectRoot}/tsconfig.native.json"
      ]
    },
    "typecheck": {
      "dependsOn": ["generate-tsconfig"]
    }
  }
}
```
