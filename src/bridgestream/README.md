# bridgestream

bridgestream is a bridge that allow one-directional stream communication from one legder app to another.

It currently allows to export Accounts from the desktop app to the mobile app.

### Desktop code gist

```js
import { makeChunks } from "@ledgerhq/wallet-common/lib/bridgestream/exporter";
const chunks = makeChunks({
  accounts,
  exporterName: "desktop",
  exporterVersion: "0.0.0"
});
// loop for each chunk of chunks[i]: display chunk QRCode, sleep a bit of time
```

### Mobile code gist

```js
import {
  parseChunkR, areChunksComplete, chunksToResult
} from "@ledgerhq/wallet-common/lib/bridgestream/importer";

class Scanning extends Component<{
  onResult: Result => void
}> {
  lastData: ?string = null;
  chunks: Data[] = [];
  completed: boolean = false;
  onBarCodeRead = ({ data }: { data: string }) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;
      this.chunks = parseChunksReducer(this.chunks, data);
      if (areChunksComplete(this.chunks)) {
        this.completed = true;
        this.props.onResult(chunksToResult(this.chunks));
      }
    }
  };

  ...
```
