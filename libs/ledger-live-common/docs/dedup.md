## JavaScript packages duplicates

What is the "NPM packages duplicate problem"? How to detect it? What does it mean and why is it a problem after all?

Most of the time, our runtime "sanityChecks" will detect this problem for you.

You might see this error:

```
      | |__| |
      |  ()  |
      |______|

${pkg} NPM package dup detected! You must `yarn list ${pkg}` and dedup with yarn or yarn-deduplicate.
```

### Why are my NPM packages duplicated?

Let's say I have library `A` that depends on `B 1.0.0` and `C 1.0.0`.
`B 1.0.0` also depends on `C 1.0.0`. So `A` depends on `C` via `B` (transitive) as well as directly.

Now imagine `C 1.1.0` is released.

If `A` now decide to depend on `C 1.1.0` and is not careful enough, this will happen:

```
├─ B@1.0.0
│  └─ C@1.0.0
└─ C@1.1.0
```

BTW, you can easily get this log by doing:

```sh
yarn list C
```

_In the context of live-common, any of the ledgerjs libs (like `@ledgerhq/errors`) is like C and live-common is like B._

One way to solve this easily is to make sure that when C is released, we'll also release a B.

So what essentially should have happened is:

- `C 1.1.0` is released.
- `B 1.1.0` is released with a dependency to `C 1.1.0`.

_This is why we need a tool like Lerna, this is also why we need to always release a live-common after releasing ledgerjs update. Because otherwise, it quickly becomes a "dup hell"._

Sometimes, yarn is getting a bit stuck into a dup situation. Most of the time upgrading all `@ledgerhq/*` libs like this works tho:

```
yarn upgrade-interactive -i  --latest
```

If it still doesn't work, or if even reinstalling the packages doesn't help to fix dups, you can use a tool called [`yarn-deduplicate`](https://github.com/atlassian/yarn-deduplicate). It's generally a good practice to keep the dependency tree deduplicated, but it might be safer to explicit the library you are de-duplicating.

### What does it mean for runtime when there are duplicates

One of the typically library that used to like multiple instance itself is React. A few of our libraries don't like that neither, including live-common because it has a few parts that are "impure" (things are hot loaded, there are caches, some state lives among the modules like the supported list of coins).

**But why is this a problem?** Well, when your dependency tree looks like

```
├─ B@1.0.0
│  └─ C@1.0.0
└─ C@1.1.0
```

This means two instances of the `C` library exist in your bundle. Not only does it make it heavier but can also create subtle but painful bugs in applications.

Typically imagine you get an instance of `Foo` from the library `C` via using `B`. Now, on the userland, if you do a code `foo instanceof Foo` where foo comes from `B->C` and `Foo` is the class from `C`, it would obviously be false. If you dedup it will be true, like it should be. You can imagine the kind of vicious bugs this creates, that's why we have `sanityChecks.ts` to detect this problem ahead of time.

This is the cause of a few production bugs in the past of Ledger Live like bad remapping of errors: We really don't want `@ledgerhq/errors` to be duplicated because we use such `instanceof` code.
