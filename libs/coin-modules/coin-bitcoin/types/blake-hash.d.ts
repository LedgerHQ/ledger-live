export class Blake {
  update: (data: Buffer | string, encoding?: BufferEncoding) => Blake;
  digest: (encoding?: BufferEncoding) => Buffer;
}

export default function (algorithm: string): Blake;
