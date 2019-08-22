// @flow

import fs from "fs";
import { Observable } from "rxjs";
import { map, concatMap } from "rxjs/operators";

export const fromNodeStream = (stream: *): Observable<Buffer> =>
  new Observable(o => {
    const endHandler = () => o.complete();
    const errorHandler = (e: Error) => o.error(e);
    const dataHandler = (data: Buffer) => o.next(data);

    stream.addListener("end", endHandler);
    stream.addListener("error", errorHandler);
    stream.addListener("data", dataHandler);

    return () => {
      stream.removeListener("end", endHandler);
      stream.removeListener("error", errorHandler);
      stream.removeListener("data", dataHandler);
    };
  });

export const fromFile = file =>
  fromNodeStream(file === "-" ? process.stdin : fs.createReadStream(file));

export const apdusFromFile = file =>
  fromFile(file).pipe(
    map(b => b.toString()),
    concatMap(str =>
      str
        .replace(/ /g, "")
        .split("\n")
        // we supports => <= recorded files but will just clear out the <= and =>
        .filter(line => !line.startsWith("<=")) // we remove the responses
        .map(line => (line.startsWith("=>") ? line.slice(2) : line)) // we just keep the sending
        .filter(Boolean)
    ),
    map(line => Buffer.from(line, "hex"))
  );

export const jsonFromFile = (file: string) =>
  Observable.create(o => {
    let acc = "";
    let count = 0;
    return fromFile(file).subscribe({
      error: e => o.error(e),
      complete: () => o.complete(),
      next: chunk => {
        const str = chunk.toString();
        let lastIndex = 0;
        for (let i = 0; i < str.length; i++) {
          switch (str[i]) {
            case "[":
            case "{":
              count++;
              break;

            case "]":
            case "}":
              count--;
              if (count === 0) {
                acc += str.slice(lastIndex, i + 1);
                lastIndex = i + 1;
                try {
                  o.next(JSON.parse(acc));
                } catch (e) {
                  o.error(e);
                }
                acc = "";
              }
              break;

            default:
          }
        }
      }
    });
  });
