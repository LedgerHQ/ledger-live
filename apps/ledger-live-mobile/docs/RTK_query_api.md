# RTK Query API

## Creating an API Slice

To query a new remote API using RTK Query you need to create an "API slice" using the [`createApi`](https://redux-toolkit.js.org/rtk-query/api/createApi) function. E.g.:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const myApi = createApi({
  reducerPath: 'exampleApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com/v1/' }),
  endpoints: (builder) => ({
    getItems: builder.query<ItemType[], void>({
      query: () => 'items',
    }),
  }),
});
```

## Using the API Slice

To use the API slice in the app, the slice must be added to the `APIs` variable of the `LLM/context/rtkQueryApi.ts` file with the reducer path as the key:

```typescript
import { myApi } from 'path/to/myApi';

const APIs = {
  [myApi.reducerPath]: myApi,
};
```

The generated hooks can then be used in the app components:

```typescript
import { myApi } from 'path/to/myApi';

const MyComponent = () => {
  const { data, error, isLoading } = myApi.useGetItemsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error occurred</div>;

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
```
