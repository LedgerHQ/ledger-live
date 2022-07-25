/// <reference types="node" />
import { Observable } from "rxjs";
export declare const fromNodeStream: (stream: any) => Observable<Buffer>;
export declare const fromFile: (file: string) => Observable<Buffer>;
export declare const apdusFromFile: (file: string) => Observable<Buffer>;
export declare const jsonFromFile: (file: string, rawValue?: boolean) => Observable<any>;
//# sourceMappingURL=stream.d.ts.map