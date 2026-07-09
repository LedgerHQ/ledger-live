---
name: ddd-data-layer-advanced
description: Apply the Ledger Wallet DDD advanced data-layer guideline for 1-to-many API responses that hydrate several entity slices. Use when creating or reviewing domain/api orchestration thunks, cross-entity dashboard APIs, multi-entity schemas, slice dispatching, and tests that validate several domain/entity packages together.
---

# DDD Data Layer Advanced Use Case

Source: https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6112641121/Guideline+Monorepo+DDD+Re-architecture+Data+Layer+Advanced+Use+Case

## Goal

Use this pattern when one API response feeds several domain slices. Keep each entity independent, then orchestrate the response in a dedicated `domain/api` package.

Example: `/api/dashboard` returns users and posts:

- `@domain/entity-user` owns user schema, mocks, and slice.
- `@domain/entity-post` owns post schema, mocks, and slice.
- `@domain/api-dashboard` fetches the dashboard payload, validates both entity lists, and dispatches both slices.
- apps/screens call the dashboard API and consume hydrated state through features.

## Layout

```text
domain/entity/user/src/data/schema.ts
domain/entity/user/src/data/schema.mock.ts
domain/entity/user/src/data/schema.test.ts
domain/entity/user/src/data/slice.ts

domain/entity/post/src/data/schema.ts
domain/entity/post/src/data/schema.mock.ts
domain/entity/post/src/data/schema.test.ts
domain/entity/post/src/data/slice.ts

domain/api/dashboard/src/dashboard.thunk.ts
domain/api/dashboard/src/dashboard.thunk.test.ts
```

Keep user-facing components in `features/flow`:

```text
features/flow/user-settings/src/components/userInfo.web.tsx
features/flow/user-settings/src/components/userInfo.native.tsx
features/flow/posts/src/components/post.web.tsx
features/flow/posts/src/components/post.native.tsx
```

Apps only compose screens and register reducers:

```text
apps/ledger-live-desktop/state-manager/configureStore.ts
apps/ledger-live-mobile/state-manager/configureStore.ts
```

## Entity Schemas

Each entity owns its own schema, type, initial state, mocks, and tests.

```typescript
import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;

export const userInitialState: User = {
  id: "",
  name: "",
  email: "",
};
```

```typescript
import { z } from "zod";

export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  authorId: z.string().uuid(),
});

export type Post = z.infer<typeof postSchema>;

export const postInitialState: Post = {
  id: "",
  title: "",
  content: "",
  authorId: "",
};
```

## Entity Slices

For collection slices, use array initial state and focused reducers.

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./schema";

const userSlice = createSlice({
  name: "users",
  initialState: [] as User[],
  reducers: {
    setUsers: (_state, action: PayloadAction<User[]>) => action.payload,
    addUser: (state, action: PayloadAction<User>) => {
      state.push(action.payload);
    },
  },
});

export const { setUsers, addUser } = userSlice.actions;
export default userSlice.reducer;
```

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Post } from "./schema";

const postSlice = createSlice({
  name: "posts",
  initialState: [] as Post[],
  reducers: {
    setPosts: (_state, action: PayloadAction<Post[]>) => action.payload,
    addPost: (state, action: PayloadAction<Post>) => {
      state.push(action.payload);
    },
  },
});

export const { setPosts, addPost } = postSlice.actions;
export default postSlice.reducer;
```

## API Orchestration

Use a `domain/api` package for the 1-to-many mapping. Validate each list with its owning entity schema before dispatching.

```typescript
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setPosts, type Post, postSchema } from "@domain/entity-post";
import { setUsers, type User, userSchema } from "@domain/entity-user";

type DashboardResponse = {
  users: User[];
  posts: Post[];
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_: void, { dispatch }) => {
    const response = await fetch("/api/dashboard");

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const data = (await response.json()) as DashboardResponse;
    const users = data.users.map((user) => userSchema.parse(user));
    const posts = data.posts.map((post) => postSchema.parse(post));

    dispatch(setUsers(users));
    dispatch(setPosts(posts));

    return { users, posts };
  }
);
```

## Tests

Use entity mock builders and assert both the returned payload and hydrated slices.

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";
import { buildPostMock } from "@domain/entity-post";
import { buildUserMock } from "@domain/entity-user";
import { store } from "@/store";
import { fetchDashboardData } from "./dashboard.thunk";

const users = [buildUserMock(), buildUserMock()];
const posts = [buildPostMock(), buildPostMock()];

const server = setupServer(
  rest.get("/api/dashboard", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ users, posts }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchDashboardData", () => {
  it("fetches and hydrates users and posts", async () => {
    const result = await store.dispatch(fetchDashboardData());

    expect(result.payload).toEqual({ users, posts });
    expect(store.getState().users).toEqual(users);
    expect(store.getState().posts).toEqual(posts);
  });
});
```

## Checklist

- Each entity package remains autonomous.
- The API package owns cross-entity response orchestration.
- Each response branch is parsed by the matching entity schema.
- Slices receive already validated data.
- Feature packages consume state and UI logic; they do not own network orchestration.
- Apps register reducers and compose screens only.
- Tests cover success, schema rejection, and failed HTTP responses when relevant.
