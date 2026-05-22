# Reference — RN native crash debugging

## Anatomy of a Fabric assertion message

Example:

```
*** Terminating app due to uncaught exception 'NSInternalInconsistencyException',
reason: 'Attempt to unmount a view which is mounted inside different view.
(parent: <RCTViewComponentView: 0x305b61e60; frame = (16 16; 0 0); alpha = 0.84; tag = 5854>,
 child:  <RCTViewComponentView: 0x178cf90e0; frame = (0 0; 0 0); tag = 5852;
         backgroundColor = UIExtendedSRGBColorSpace 0 0 0 0.05>, index: 0)'
```

What each field tells you:

| Field | Meaning |
|---|---|
| `tag` | Fabric/React tag of the view. Lower tag = created earlier. **Child tag < parent tag is a strong signal of reparenting** (the child existed before its supposed parent was created). |
| `frame = (x y; w h)` | Layout in superview coordinates. `(16 16; 0 0)` = origin (16,16), size 0×0. A 0×0 view usually means the view hasn't been laid out yet — fresh mount. |
| `alpha = 0.84` | Mid-animation opacity (between 1.0 and `TouchableOpacity.activeOpacity` default 0.2). Tells you a press animation or a fade animation is in flight at crash time. |
| `backgroundColor = 0 0 0 0.05` | sRGB premultiplied. `rgba(0,0,0,0.05)` often maps to `neutral.c30` / `opacityDefault.c05` in the Ledger theme — useful to grep for. |
| `index: N` | Which child position in the parent. |

Cross-reference the bg color and frame against styled components in suspect screens. The match is often unique.

## lldb cheatsheet (paused on `objc_exception_throw`)

Common variable names in `RCTPerformMountInstructions` (`RCTMountingManager.mm`):

```
po parentViewDescriptor.view
po oldChildViewDescriptor.view
p  mutation.parentTag
p  mutation.index
p  oldChildShadowView.componentName     # "View", "Image", "TextInput", "ScrollView", ...
p  oldChildShadowView.tag
```

UIView traversal to identify the React component:

```
po [oldChildViewDescriptor.view superview]
po [oldChildViewDescriptor.view accessibilityIdentifier]   # = RN testID
po [oldChildViewDescriptor.view subviews]

po [parentViewDescriptor.view superview]
po [[parentViewDescriptor.view superview] accessibilityIdentifier]
po [parentViewDescriptor.view subviews]
po [[parentViewDescriptor.view superview] superview]
```

Print a whole view tree from a node:

```
po [(UIView*)0x178cf90e0 recursiveDescription]
```

If `accessibilityIdentifier` is nil, climb superviews until you find one that's set. Then `grep -rn 'testID="<id>"' apps/ledger-live-mobile/src libs/ui`.

Hermes JS state from native (rough, last resort):

```
po (id)[[RCTBridge currentBridge] valueForKey:@"_jsThread"]
```

Usually not useful — Fabric crashes happen on the UI thread mid-mount, JS is paused already.

## Common Fabric crash patterns

Most "Attempt to unmount a view which is mounted inside different view" crashes match one of these.

### 1. Unstable `keyExtractor` / list keys

Pattern:

```tsx
keyExtractor={(item, index) => item.id + index}  // wrong: index changes on filter
data.map((x, i) => <Row key={i} ... />)          // wrong: index as key in array
<Flex key={index}>                                // useless on single child
```

Symptom: list re-renders after data update (search filter, sort, refresh) and crashes within 1s of the data arriving.

Fix: use a stable identity from the data (`item.id`). Never include `index` in keys for lists that filter/sort/reorder.

### 2. Reanimated animation running through unmount

Pattern (lib code, e.g. `@ledgerhq/lumen-ui-rnative` Pulse, Skeleton wrappers):

```tsx
useEffect(() => {
  sv.value = withRepeat(withTiming(...), -1);
  return () => cancelAnimation(sv);
}, [...]);
```

When the parent toggles `loading ? <Skeleton/> : <Image/>`, the Skeleton (and its inner `Animated.View` driven by Reanimated) unmounts mid-animation. The cleanup `cancelAnimation` runs, but Fabric's mount instruction for unmount races the animation thread. Tag mismatch → crash.

Symptom: orphan child has `testID="skeleton"` (or other animated wrapper), parent frame is the wrapper's measured 0×0 placeholder.

Fixes (in order of preference):
- Avoid the conditional swap: render the final content with `opacity: loading ? skeletonOpacity : 1` instead of `loading ? <Skeleton/> : <Content/>`.
- Patch the lib to use Reanimated's `Layout.exiting` so unmount is animation-aware.
- As a workaround at the call-site, set `loading={false}` to skip the skeleton for list contexts.
- Upgrade Reanimated and/or React Native — these races are progressively fixed upstream.

### 3. Inline JSX recreated every render in FlatList sticky header

Pattern:

```tsx
const listHeaderComponent = (<View>...</View>);          // new element each render
return <FlatList stickyHeaderIndices={[0]} ListHeaderComponent={listHeaderComponent} ... />;
```

Each render produces a new ListHeaderComponent identity. Fabric + sticky headers + Animated.FlatList compounds into reparenting glitches.

Fix: wrap header/footer/empty/refreshControl in `useMemo`, extract `renderItem` to `useCallback`, extract style/array constants outside the component:

```tsx
const stickyHeaderIndices = [0];
const contentContainerStyle = { paddingHorizontal: 16 };

function View(...) {
  const listHeaderComponent = useMemo(() => <View>...</View>, [deps]);
  const renderItem = useCallback(({item}) => <Row item={item}/>, [deps]);
  ...
}
```

### 4. Third-party lib not Fabric-ready

Symptom: native stack includes a third-party module name (gesture handler, bottom-sheet, lottie, …). The lib renders into UIViews it manages directly, behind RN's back.

Fix: check the lib's release notes for Fabric/new-arch support. Pin to the first version with proper Fabric implementation, or wrap the lib in `<View collapsable={false}>` to give Fabric a stable anchor.

### 5. Conditional rendering switching component types under the same parent

Pattern:

```tsx
{loading && <Skeleton/>}
{!loading && shouldFallback && <Text>...</Text>}
{!loading && !shouldFallback && <Image .../>}
```

Three siblings that mount/unmount in coordinated transitions. Combined with any inflight animation on one of them, this is the reparenting recipe.

Fix: render all three branches always, hide with `opacity: 0` or `display: 'none'`, OR render a single component that internally swaps content via state without changing the JSX shape.

## When to escalate

If the crash matches none of the above and the lldb traversal still doesn't point to a recognisable component:

1. Toggle `RCT_NEW_ARCH_ENABLED = '0'` in `apps/ledger-live-mobile/ios/Podfile`, `pod install`, rebuild. If the crash disappears on Paper, the bug is Fabric-specific (most are). Revert the Podfile + lockfile before committing.
2. Bisect on `git log --oneline` for the screen / library that introduced the crash.
3. Capture a sysdiagnose / sample of the app at crash time for the platform team.

## Metro / dev-loop gotchas

- `Watchpack Error: EMFILE: too many open files, watch` → the watcher silently stops. Edits never reach the bundle. The fix in source is invisible at runtime. Restart Metro with `--reset-cache`.
- `react-native run-ios` fails to spawn a Metro window in sandboxed/non-interactive shells (`open …launchPackager.command` errors). Start Metro separately (`pnpm mobile start:ios`) and run the build with `--no-packager`.
- `react-native run-ios --target <scheme>` picks the first physical device if one is connected. Force the simulator with `--simulator="<device-name>"` (pick an installed one via `xcrun simctl list devices`).
- Don't trust silently failing fast refresh. Confirm a fresh `Compiled ios in Xs` line in Metro after each edit.
