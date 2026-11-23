# @shared/share-sheet

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Opens the system share sheet on mobile, with a text and, optionally, an image of a view. It owns
[`react-native-share`](https://github.com/react-native-share/react-native-share) and
[`react-native-view-shot`](https://github.com/gre/react-native-view-shot): callers never import them.

## Exports

| Export              | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `openShareSheet`    | `(content: ShareSheetContent) => Promise<void>`, resolves once the sheet closes |
| `ShareSheetContent` | `{ message, capture? }`: the text, and a ref on the view to share as a PNG      |

It never throws: a cancel or a failure resolves like a share. A view that cannot be captured shares
the message alone.

## Usage

```tsx
import { openShareSheet } from "@shared/share-sheet";

const cardRef = useRef<View>(null);

// <View ref={cardRef} collapsable={false}>…</View>
await openShareSheet({ message: address, capture: cardRef });
```

A captured view needs `collapsable={false}`: Android drops views that only lay out their children.

## Native modules

Both libraries are native modules: the app lists them in its own dependencies for autolinking.

## Testing

Tests asserting on a share should `jest.mock("@shared/share-sheet")`, or mock `react-native-share`
and `react-native-view-shot` as Ledger Wallet mobile's jest setup does.
