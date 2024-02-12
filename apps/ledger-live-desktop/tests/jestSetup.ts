import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-expect-error weird compatibility
global.TextDecoder = TextDecoder;
