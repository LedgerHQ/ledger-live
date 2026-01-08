# Features

This directory contains isolated, reusable feature modules that can be shared across Ledger Live applications (Mobile, Desktop).

## Table of Contents

- [Overview](#overview)
- [Naming Conventions](#naming-conventions)
- [Folder Structure](#folder-structure)
- [Creating a New Feature](#creating-a-new-feature)
- [Styling with Tailwind (Desktop)](#styling-with-tailwind-desktop)
- [Platform-Specific Components](#platform-specific-components)
- [Import Aliases](#import-aliases)
- [Best Practices](#best-practices)

---

## Overview

Features are independent packages that:

- **Encapsulate** specific business logic or UI components
- **Are shared** across mobile and desktop applications
- **Maintain** their own dependencies and configurations
- **Support** platform-specific implementations

---

## Naming Conventions

### 🚨 CRITICAL: Folder Naming

**Feature folders MUST use kebab-case naming.**

#### ✅ Valid Names

```
market-banner
user-profile
transaction-history
eth-staking-flow
```

#### ❌ Invalid Names

```
marketBanner         (camelCase)
MarketBanner         (PascalCase)
market_banner        (snake_case)
Market-Banner        (Mixed case)
```

## Folder Structure

Each feature follows a consistent structure:

```
features/
└── my-feature/              # kebab-case folder name
    ├── package.json         # Feature package configuration
    ├── tsconfig.json        # TypeScript configuration
    ├── jest.config.js       # Jest configuration
    ├── .eslintrc.js         # ESLint configuration (optional)
    └── src/
        ├── index.ts         # Main entry point (Desktop/Web)
        ├── index.native.ts  # React Native entry point (Mobile)
        ├── types.d.ts       # Shared types
        ├── components/      # Feature components
        │   ├── MyComponent.web.tsx     # Desktop/Web specific
        │   └── MyComponent.native.tsx  # Mobile specific
        └── utils/           # Utilities and helpers
            └── cn.ts        # Classname utility (for Tailwind)
```

### Required Files

#### `package.json`

```json
{
  "name": "@ledgerhq/features/my-feature",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "react-native": "src/index.native.ts",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint src --ext .js,.jsx,.ts,.tsx --fix",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "catalog:",
    "@ledgerhq/live-common": "workspace:*"
  },
  "peerDependencies": {
    "react-native": ">0.70"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "typescript": "5.4.3"
  }
}
```

#### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

---

## Creating a New Feature

### Step 1: Create the Feature Folder

```bash
# Use kebab-case!
mkdir -p features/my-feature/src
cd features/my-feature
```

### Step 2: Initialize package.json

```bash
# Copy from an existing feature or create from scratch
cp ../market-banner/package.json .
```

Update the `name` field:

```json
{
  "name": "@ledgerhq/features/my-feature"
}
```

### Step 3: Add TypeScript Configuration

```bash
cp ../market-banner/tsconfig.json .
```

### Step 4: Create Entry Points

**`src/index.ts`** (Desktop/Web):

```typescript
export { MyComponent } from "./components/MyComponent.web";
export type { MyComponentProps } from "./types";
```

**`src/index.native.ts`** (Mobile):

```typescript
export { MyComponent } from "./components/MyComponent.native";
export type { MyComponentProps } from "./types";
```

### Step 5: Add Your Components

Create platform-specific or shared components in `src/components/`.

### Step 6: Install Dependencies

From the **project root**:

```bash
pnpm install
```

The feature will automatically:

- Be registered in Metro bundler (Mobile)
- Be available for import via `@ledgerhq/features/my-feature`

---

## Styling with Tailwind (Desktop)

Features can use **Tailwind CSS** for desktop/web components.

### Step 1: Add Tailwind Dependencies

Update your feature's `package.json`:

```json
{
  "dependencies": {
    "clsx": "catalog:",
    "tailwind-merge": "catalog:",
    "@ledgerhq/lumen-ui-react": "catalog:",
    "@ledgerhq/lumen-ui-react": "catalog:"
  }
}
```

### Step 2: Register Feature in Tailwind Config

**Update `apps/ledger-live-desktop/tailwind.config.ts`**:

```typescript
import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ledgerhq/lumen-design-core";

const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@ledgerhq/lumen-ui-react/dist/lib/**/*.{js,ts,jsx,tsx}",

    // Add your feature here 👇
    "../../features/market-banner/src/**/*.web.{js,ts,jsx,tsx}",
    "../../features/my-feature/src/**/*.web.{js,ts,jsx,tsx}", // ✅ Add this line
  ],
  presets: [ledgerLivePreset],
} satisfies Config;

export default config;
```

#### Pattern Explanation

```typescript
"../../features/{feature-name}/src/**/*.web.{js,ts,jsx,tsx}";
```

- `../../features/` — Path from desktop app to features folder
- `{feature-name}/` — Your kebab-case feature folder name
- `src/**/*.web.{js,ts,jsx,tsx}` — All web-specific files in your feature

### Step 3: Use Tailwind in Components

**`src/components/MyComponent.web.tsx`**:

```tsx
import React from "react";
import { cn } from "../utils/cn";

type MyComponentProps = {
  variant?: "primary" | "secondary";
  className?: string;
};

export const MyComponent = ({ variant = "primary", className }: MyComponentProps) => {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-2",
        variant === "primary" && "bg-accent text-muted",
        variant === "secondary" && "bg-gray text-muted-strong",
        className, // Allow external overrides
      )}
    >
      My Component
    </div>
  );
};
```

---

## Platform-Specific Components

Use file extensions to create platform-specific implementations:

### Naming Conventions

- **`.web.tsx`** — Desktop/Web (React)
- **`.native.tsx`** — Mobile (React Native)
- **`.tsx`** — Shared across platforms

### Example: Platform-Specific Component

**`src/components/MyComponent.web.tsx`**:

```tsx
import React from "react";
import { cn } from "../utils/cn";

export const MyComponent = () => {
  return <div className={cn("p-4 bg-blue-500")}>Web Component</div>;
};
```

**`src/components/MyComponent.native.tsx`**:

```tsx
import React from "react";
import { View, Text } from "react-native";
import { Flex } from "@ledgerhq/lumen-ui-rnative";

export const MyComponent = () => {
  return (
    <Flex p={4} bg="blue.500">
      <Text>Mobile Component</Text>
    </Flex>
  );
};
```

### Import Resolution

The bundler automatically resolves the correct file based on the platform:

```typescript
// In Mobile app
import { MyComponent } from "@ledgerhq/features/my-feature";
// ✅ Imports from index.native.ts → MyComponent.native.tsx

// In Desktop app
import { MyComponent } from "@ledgerhq/features/my-feature";
// ✅ Imports from index.ts → MyComponent.web.tsx
```

---

## Import Aliases

Features are automatically registered with the Metro bundler (Mobile) and TypeScript.

### Importing from Apps

```typescript
// ✅ Use the alias
import { MyComponent } from "@ledgerhq/features/my-feature";

// ❌ Don't use relative paths
import { MyComponent } from "../../../features/my-feature/src/components/MyComponent";
```

### How It Works

**Metro Config** (`apps/ledger-live-mobile/metro.config.js`):

```javascript
const buildFeatureAliases = () => {
  const featuresDir = path.resolve(projectRootDir, "features");
  return fs.readdirSync(featuresDir).reduce((aliases, featureName) => {
    const srcPath = path.resolve(featuresDir, featureName, "src");
    if (fs.existsSync(srcPath)) {
      aliases[`@ledgerhq/features/${featureName}`] = srcPath;
    }
    return aliases;
  }, {});
};
```

This automatically creates aliases like:

- `@ledgerhq/features/market-banner` → `features/market-banner/src`
- `@ledgerhq/features/my-feature` → `features/my-feature/src`

---

## Best Practices

### 1. Keep Features Isolated

- Features should be **self-contained**
- Avoid tight coupling with apps
- Use props for configuration

### 2. Platform-Specific Code

- Use `.web.tsx` and `.native.tsx` for platform-specific UI
- Share logic in `.ts` files

### 3. Type Safety

- Ensure strict TypeScript compliance

### 4. Testing

- Add `jest.config.js` to your feature
- Write unit tests for utilities
- Write integration tests for components

### 5. Dependencies

- Use `catalog:` for shared dependencies (managed by workspace)
- Use `workspace:*` for monorepo packages
- Keep dependencies minimal

### 6. Styling

- **Mobile**: Use `@ledgerhq/lumen-ui-rnative` components
- **Desktop**: Use Tailwind CSS with `cn()` utility or Use `@ledgerhq/lumen-ui-react` components
