# @shared/sensitive

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Types that keep sensitive values out of analytics, logs and error messages.

A value is sensitive when its zod schema carries the `Sensitive` brand, as the account key and the
address of `@domain/entity-account-descriptor` do: `z.string().brand<"AccountKey">().brand<"Sensitive">()`.

`NoSensitive<T>` is `unknown` when `T` holds no such value, at any depth, and a type no value
matches otherwise. An API intersects its parameter with it to refuse sensitive values at compile time:

```ts
export function track<P extends Props>(event: string, props?: P & NoSensitive<P>) {}

track("receive_opened", { network }); // ok
track("receive_opened", { address }); // type error: pass the AccountUUID instead
```

`any` and `unknown` values pass: the check only catches what the types know.
