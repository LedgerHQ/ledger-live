### Analytics

We use a lightweight opt-out analytics layer composed of different api and sdk.

These tools are targetted towards internal contributors only or with

- **_Segment integration_** 🠒 General use analytics

in order to track events we use segment API with specific react API

```js
import { Track, TrackScreen } from "../analytics";
import Button from "./Button";

...
<Track
  onMount
  event={`Event - ${data}`}
  eventProperties={{ myData: data }}
/>
<TrackScreen category="ScreenCategory" name="FirstScreen" />
<Button onPress={callback} event="ButtonPress" eventProperties={{ myData: data }} />
...

```

`Track` helps track events that can be linked to a component lifecycle.

`TracScreen` tracks mount events on a page with a formatted category (section of the app) and screen name.

`Button` helps track click/press events with event and eventProperties props.
