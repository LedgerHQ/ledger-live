"use strict";
exports.ids = [
    "62"
];
exports.modules = {
    "../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/multipart-parser.js" (__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            toFormData: ()=>toFormData
        });
        var fetch_blob_from_js__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/from.js");
        var formdata_polyfill_esm_min_js__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/formdata-polyfill@4.0.10/node_modules/formdata-polyfill/esm.min.js");
        let s = 0;
        const S = {
            START_BOUNDARY: s++,
            HEADER_FIELD_START: s++,
            HEADER_FIELD: s++,
            HEADER_VALUE_START: s++,
            HEADER_VALUE: s++,
            HEADER_VALUE_ALMOST_DONE: s++,
            HEADERS_ALMOST_DONE: s++,
            PART_DATA_START: s++,
            PART_DATA: s++,
            END: s++
        };
        let f = 1;
        const F = {
            PART_BOUNDARY: f,
            LAST_BOUNDARY: f *= 2
        };
        const LF = 10;
        const CR = 13;
        const SPACE = 32;
        const HYPHEN = 45;
        const COLON = 58;
        const A = 97;
        const Z = 122;
        const lower = (c)=>0x20 | c;
        const noop = ()=>{};
        class MultipartParser {
            constructor(boundary){
                this.index = 0;
                this.flags = 0;
                this.onHeaderEnd = noop;
                this.onHeaderField = noop;
                this.onHeadersEnd = noop;
                this.onHeaderValue = noop;
                this.onPartBegin = noop;
                this.onPartData = noop;
                this.onPartEnd = noop;
                this.boundaryChars = {};
                boundary = '\r\n--' + boundary;
                const ui8a = new Uint8Array(boundary.length);
                for(let i = 0; i < boundary.length; i++){
                    ui8a[i] = boundary.charCodeAt(i);
                    this.boundaryChars[ui8a[i]] = true;
                }
                this.boundary = ui8a;
                this.lookbehind = new Uint8Array(this.boundary.length + 8);
                this.state = S.START_BOUNDARY;
            }
            write(data) {
                let i = 0;
                const length_ = data.length;
                let previousIndex = this.index;
                let { lookbehind, boundary, boundaryChars, index, state, flags } = this;
                const boundaryLength = this.boundary.length;
                const boundaryEnd = boundaryLength - 1;
                const bufferLength = data.length;
                let c;
                let cl;
                const mark = (name)=>{
                    this[name + 'Mark'] = i;
                };
                const clear = (name)=>{
                    delete this[name + 'Mark'];
                };
                const callback = (callbackSymbol, start, end, ui8a)=>{
                    if (void 0 === start || start !== end) this[callbackSymbol](ui8a && ui8a.subarray(start, end));
                };
                const dataCallback = (name, clear)=>{
                    const markSymbol = name + 'Mark';
                    if (!(markSymbol in this)) return;
                    if (clear) {
                        callback(name, this[markSymbol], i, data);
                        delete this[markSymbol];
                    } else {
                        callback(name, this[markSymbol], data.length, data);
                        this[markSymbol] = 0;
                    }
                };
                for(i = 0; i < length_; i++){
                    c = data[i];
                    switch(state){
                        case S.START_BOUNDARY:
                            if (index === boundary.length - 2) {
                                if (c === HYPHEN) flags |= F.LAST_BOUNDARY;
                                else if (c !== CR) return;
                                index++;
                                break;
                            }
                            if (index - 1 === boundary.length - 2) {
                                if (flags & F.LAST_BOUNDARY && c === HYPHEN) {
                                    state = S.END;
                                    flags = 0;
                                } else {
                                    if (flags & F.LAST_BOUNDARY || c !== LF) return;
                                    index = 0;
                                    callback('onPartBegin');
                                    state = S.HEADER_FIELD_START;
                                }
                                break;
                            }
                            if (c !== boundary[index + 2]) index = -2;
                            if (c === boundary[index + 2]) index++;
                            break;
                        case S.HEADER_FIELD_START:
                            state = S.HEADER_FIELD;
                            mark('onHeaderField');
                            index = 0;
                        case S.HEADER_FIELD:
                            if (c === CR) {
                                clear('onHeaderField');
                                state = S.HEADERS_ALMOST_DONE;
                                break;
                            }
                            index++;
                            if (c === HYPHEN) break;
                            if (c === COLON) {
                                if (1 === index) return;
                                dataCallback('onHeaderField', true);
                                state = S.HEADER_VALUE_START;
                                break;
                            }
                            cl = lower(c);
                            if (cl < A || cl > Z) return;
                            break;
                        case S.HEADER_VALUE_START:
                            if (c === SPACE) break;
                            mark('onHeaderValue');
                            state = S.HEADER_VALUE;
                        case S.HEADER_VALUE:
                            if (c === CR) {
                                dataCallback('onHeaderValue', true);
                                callback('onHeaderEnd');
                                state = S.HEADER_VALUE_ALMOST_DONE;
                            }
                            break;
                        case S.HEADER_VALUE_ALMOST_DONE:
                            if (c !== LF) return;
                            state = S.HEADER_FIELD_START;
                            break;
                        case S.HEADERS_ALMOST_DONE:
                            if (c !== LF) return;
                            callback('onHeadersEnd');
                            state = S.PART_DATA_START;
                            break;
                        case S.PART_DATA_START:
                            state = S.PART_DATA;
                            mark('onPartData');
                        case S.PART_DATA:
                            previousIndex = index;
                            if (0 === index) {
                                i += boundaryEnd;
                                while(i < bufferLength && !(data[i] in boundaryChars))i += boundaryLength;
                                i -= boundaryEnd;
                                c = data[i];
                            }
                            if (index < boundary.length) if (boundary[index] === c) {
                                if (0 === index) dataCallback('onPartData', true);
                                index++;
                            } else index = 0;
                            else if (index === boundary.length) {
                                index++;
                                if (c === CR) flags |= F.PART_BOUNDARY;
                                else if (c === HYPHEN) flags |= F.LAST_BOUNDARY;
                                else index = 0;
                            } else if (index - 1 === boundary.length) if (flags & F.PART_BOUNDARY) {
                                index = 0;
                                if (c === LF) {
                                    flags &= ~F.PART_BOUNDARY;
                                    callback('onPartEnd');
                                    callback('onPartBegin');
                                    state = S.HEADER_FIELD_START;
                                    break;
                                }
                            } else if (flags & F.LAST_BOUNDARY) if (c === HYPHEN) {
                                callback('onPartEnd');
                                state = S.END;
                                flags = 0;
                            } else index = 0;
                            else index = 0;
                            if (index > 0) lookbehind[index - 1] = c;
                            else if (previousIndex > 0) {
                                const _lookbehind = new Uint8Array(lookbehind.buffer, lookbehind.byteOffset, lookbehind.byteLength);
                                callback('onPartData', 0, previousIndex, _lookbehind);
                                previousIndex = 0;
                                mark('onPartData');
                                i--;
                            }
                            break;
                        case S.END:
                            break;
                        default:
                            throw new Error(`Unexpected state entered: ${state}`);
                    }
                }
                dataCallback('onHeaderField');
                dataCallback('onHeaderValue');
                dataCallback('onPartData');
                this.index = index;
                this.state = state;
                this.flags = flags;
            }
            end() {
                if (this.state === S.HEADER_FIELD_START && 0 === this.index || this.state === S.PART_DATA && this.index === this.boundary.length) this.onPartEnd();
                else if (this.state !== S.END) throw new Error('MultipartParser.end(): stream ended unexpectedly');
            }
        }
        function _fileName(headerValue) {
            const m = headerValue.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i);
            if (!m) return;
            const match = m[2] || m[3] || '';
            let filename = match.slice(match.lastIndexOf('\\') + 1);
            filename = filename.replace(/%22/g, '"');
            filename = filename.replace(/&#(\d{4});/g, (m, code)=>String.fromCharCode(code));
            return filename;
        }
        async function toFormData(Body, ct) {
            if (!/multipart/i.test(ct)) throw new TypeError('Failed to fetch');
            const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
            if (!m) throw new TypeError('no or bad content-type header, no multipart boundary');
            const parser = new MultipartParser(m[1] || m[2]);
            let headerField;
            let headerValue;
            let entryValue;
            let entryName;
            let contentType;
            let filename;
            const entryChunks = [];
            const formData = new formdata_polyfill_esm_min_js__rspack_import_1.fS();
            const onPartData = (ui8a)=>{
                entryValue += decoder.decode(ui8a, {
                    stream: true
                });
            };
            const appendToFile = (ui8a)=>{
                entryChunks.push(ui8a);
            };
            const appendFileToFormData = ()=>{
                const file = new fetch_blob_from_js__rspack_import_0.ZH(entryChunks, filename, {
                    type: contentType
                });
                formData.append(entryName, file);
            };
            const appendEntryToFormData = ()=>{
                formData.append(entryName, entryValue);
            };
            const decoder = new TextDecoder('utf-8');
            decoder.decode();
            parser.onPartBegin = function() {
                parser.onPartData = onPartData;
                parser.onPartEnd = appendEntryToFormData;
                headerField = '';
                headerValue = '';
                entryValue = '';
                entryName = '';
                contentType = '';
                filename = null;
                entryChunks.length = 0;
            };
            parser.onHeaderField = function(ui8a) {
                headerField += decoder.decode(ui8a, {
                    stream: true
                });
            };
            parser.onHeaderValue = function(ui8a) {
                headerValue += decoder.decode(ui8a, {
                    stream: true
                });
            };
            parser.onHeaderEnd = function() {
                headerValue += decoder.decode();
                headerField = headerField.toLowerCase();
                if ('content-disposition' === headerField) {
                    const m = headerValue.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i);
                    if (m) entryName = m[2] || m[3] || '';
                    filename = _fileName(headerValue);
                    if (filename) {
                        parser.onPartData = appendToFile;
                        parser.onPartEnd = appendFileToFormData;
                    }
                } else if ('content-type' === headerField) contentType = headerValue;
                headerValue = '';
                headerField = '';
            };
            for await (const chunk of Body)parser.write(chunk);
            parser.end();
            return formData;
        }
    }
};
