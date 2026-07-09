---
name: ddd-types-state-mocks
description: Apply the Ledger Wallet DDD data-layer guideline for entity types, initial state, mocks, slices, selectors, and simple 1-to-1 API mappings. Use when creating or reviewing domain/entity packages, schema.ts, schema.mock.ts, slice.ts, selectors.ts, RTK Query APIs, and related tests.
---

# DDD Types, Initial State, And Mocks

Source: https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6102941793/Guideline+Monorepo+DDD+Re-architecture+Types+Initial+State+Mocks

## Goal

For a simple use case where one API response maps to one slice, keep the data layer explicit and colocated:

- entity schema and inferred type
- initial state for every property
- mock builder
- schema, slice, selector, and API tests
- API contract in `domain/api`

## Package Layout

```text
domain/entity/user/
  src/
    data/
      schema.ts
      schema.test.ts
      schema.mock.ts
      selectors.ts
      selectors.test.ts
      slice.ts
      slice.test.ts
    index.ts
  package.json

domain/api/user/
  src/
    user.api.ts
    user.api.test.ts
    index.ts
  package.json
```

Feature UI consumes the entity/API through package exports:

```text
features/flow/user-settings/src/components/userInfo.web.tsx
features/flow/user-settings/src/components/userInfo.native.tsx
apps/ledger-live-desktop/screens/UserScreen.web.tsx
apps/ledger-live-mobile/screens/UserScreen.native.tsx
```

## Entity Schema

Use Zod first, infer the TypeScript type from the schema, and export an initial state with the same shape.

```typescript
import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

export const userInitialState: User = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  createdAt: "",
};
```

## Mocks

Put builders next to the schema in `schema.mock.ts`. Return fully valid data.

```typescript
import { faker } from "@faker-js/faker";
import type { User } from "./schema";

export const buildUserMock = (): User => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  createdAt: faker.date.past().toISOString(),
});
```

## Schema Tests

Cover valid mocks, invalid payloads, and initial defaults.

```typescript
import { buildUserMock } from "./schema.mock";
import { userInitialState, userSchema } from "./schema";

describe("user schema", () => {
  it("validates mock data", () => {
    expect(() => userSchema.parse(buildUserMock())).not.toThrow();
  });

  it("rejects invalid data", () => {
    expect(() =>
      userSchema.parse({
        id: "not-uuid",
        firstName: "",
        lastName: "",
        email: "bad",
        createdAt: "invalid",
      })
    ).toThrow();
  });

  it("defines empty initial state", () => {
    expect(userInitialState).toEqual({
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      createdAt: "",
    });
  });
});
```

## Slice

Keep reducers small and export actions plus reducer from the entity package.

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { buildUserMock } from "./schema.mock";
import { type User, userInitialState } from "./schema";

const userSlice = createSlice({
  name: "user",
  initialState: userInitialState,
  reducers: {
    setUser: (_state, action: PayloadAction<User>) => action.payload,
    resetUser: () => userInitialState,
    updateEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
  },
});

export const { setUser, resetUser, updateEmail } = userSlice.actions;
export const preloadUserMock = () => setUser(buildUserMock());
export default userSlice.reducer;
```

## Selectors

Colocate selectors with the entity. Adapt the root-state type to the package's existing store contract; do not import app aliases from a domain package unless that contract is already owned by the package.

```typescript
import { createSelector } from "@reduxjs/toolkit";
import type { User } from "./schema";

type UserState = { user: User };

export const selectUser = (state: UserState): User => state.user;
export const selectUserEmail = createSelector(selectUser, (user) => user.email);
export const selectUserFullName = createSelector(
  selectUser,
  (user) => `${user.firstName} ${user.lastName}`
);
```

## Simple API

Put network contracts and transformations in `domain/api/<entity>`. The API package may depend on `@domain/entity-<entity>`.

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "@domain/entity-user";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (build) => ({
    getUser: build.query<User, string>({
      query: (id) => `users/${id}`,
    }),
    updateUser: build.mutation<User, Partial<User> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `users/${id}`,
        method: "PUT",
        body,
      }),
    }),
  }),
});

export const { useGetUserQuery, useUpdateUserMutation } = userApi;
```

## Checklist

- `schema.ts` is the source of truth for types.
- `schema.mock.ts` builds valid data only.
- Initial state covers every property.
- Tests parse valid mocks and reject invalid data.
- Slice tests cover default state, set, reset, and focused updates.
- Selectors are colocated and tested.
- API code lives in `domain/api`, not in `features/flow`.
