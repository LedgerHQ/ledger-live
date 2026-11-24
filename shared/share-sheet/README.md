# @shared/share-sheet

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Opens the system share sheet on mobile, with a text and, optionally, an image of a view. It owns
[`react-native-share`](https://github.com/react-native-share/react-native-share) and
[`react-native-view-shot`](https://github.com/gre/react-native-view-shot): callers never import them.

## Exports

| Export              | Description                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| `openShareSheet`    | `(content: ShareSheetContent) => Promise<void>`, resolves once the sheet closes     |
| `ShareSheetContent` | `{ message, imageUrl? }`: the text, and an image as `captureView` returns it        |
| `captureView`       | `(view: RefObject<View \| null>) => Promise<string \| undefined>`, a PNG of the view |

A cancel resolves like a share; a sheet that cannot open rejects. `captureView` never throws: a view
that cannot be captured resolves `undefined`, and the share goes on with the message alone.

On Android, a caller that wraps the share in the app lock's `leaveAppFor` catches the rejection
outside that wrapper: `leaveAppFor` releases its app lock exemption only when the task rejects.

## Usage

```tsx
import { captureView, openShareSheet } from "@shared/share-sheet";

const cardRef = useRef<View>(null);

// <View ref={cardRef} collapsable={false}>…</View>
const imageUrl = await captureView(cardRef);
await openShareSheet({ message: address, imageUrl });
```

A captured view needs `collapsable={false}`: Android drops views that only lay out their children.

## Native modules

Both libraries are native modules: the app lists them in its own dependencies for autolinking.

## Testing

Tests asserting on a share should `jest.mock("@shared/share-sheet")`, or mock `react-native-share`
and `react-native-view-shot` as Ledger Wallet mobile's jest setup does.
