"use strict";
exports.ids = [
    971
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/AwsRestJsonProtocol.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Y: ()=>AwsRestJsonProtocol
        });
        var HttpBindingProtocol = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/HttpBindingProtocol.js");
        var HttpInterceptingShapeSerializer = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeSerializer.js");
        var HttpInterceptingShapeDeserializer = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeDeserializer.js");
        var NormalizedSchema = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js");
        var ProtocolLib = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js");
        var ConfigurableSerdeContext = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js");
        var determineTimestampFormat = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/serde/determineTimestampFormat.js");
        var lazy_json = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/lazy-json.js");
        var date_utils = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js");
        var NumericValue = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js");
        var fromBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/fromBase64.js");
        var UnionSerde = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/UnionSerde.js");
        function jsonReviver(key, value, context) {
            if (context?.source) {
                const numericString = context.source;
                if ("number" == typeof value) {
                    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER || numericString !== String(value)) {
                        const isFractional = numericString.includes(".");
                        if (isFractional) return new NumericValue.D(numericString, "bigDecimal");
                        return BigInt(numericString);
                    }
                }
            }
            return value;
        }
        var collect_stream_body = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/collect-stream-body.js");
        var toUtf8 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@4.2.2/node_modules/@smithy/util-utf8/dist-es/toUtf8.js");
        const collectBodyString = (streamBody, context)=>(0, collect_stream_body.P)(streamBody, context).then((body)=>(context?.utf8Encoder ?? toUtf8.P)(body));
        const parseJsonBody = (streamBody, context)=>collectBodyString(streamBody, context).then((encoded)=>{
                if (encoded.length) try {
                    return JSON.parse(encoded);
                } catch (e) {
                    if (e?.name === "SyntaxError") Object.defineProperty(e, "$responseBodyText", {
                        value: encoded
                    });
                    throw e;
                }
                return {};
            });
        const loadRestJsonErrorCode = (output, data)=>{
            const findKey = (object, key)=>Object.keys(object).find((k)=>k.toLowerCase() === key.toLowerCase());
            const sanitizeErrorCode = (rawValue)=>{
                let cleanValue = rawValue;
                if ("number" == typeof cleanValue) cleanValue = cleanValue.toString();
                if (cleanValue.indexOf(",") >= 0) cleanValue = cleanValue.split(",")[0];
                if (cleanValue.indexOf(":") >= 0) cleanValue = cleanValue.split(":")[0];
                if (cleanValue.indexOf("#") >= 0) cleanValue = cleanValue.split("#")[1];
                return cleanValue;
            };
            const headerKey = findKey(output.headers, "x-amzn-errortype");
            if (void 0 !== headerKey) return sanitizeErrorCode(output.headers[headerKey]);
            if (data && "object" == typeof data) {
                const codeKey = findKey(data, "code");
                if (codeKey && void 0 !== data[codeKey]) return sanitizeErrorCode(data[codeKey]);
                if (void 0 !== data["__type"]) return sanitizeErrorCode(data["__type"]);
            }
        };
        class JsonShapeDeserializer extends ConfigurableSerdeContext.B {
            settings;
            constructor(settings){
                super();
                this.settings = settings;
            }
            async read(schema, data) {
                return this._read(schema, "string" == typeof data ? JSON.parse(data, jsonReviver) : await parseJsonBody(data, this.serdeContext));
            }
            readObject(schema, data) {
                return this._read(schema, data);
            }
            _read(schema, value) {
                const isObject = null !== value && "object" == typeof value;
                const ns = NormalizedSchema.l1.of(schema);
                if (isObject) {
                    if (ns.isStructSchema()) {
                        const record = value;
                        const union = ns.isUnionSchema();
                        const out = {};
                        let nameMap;
                        const { jsonName } = this.settings;
                        if (jsonName) nameMap = {};
                        let unionSerde;
                        if (union) unionSerde = new UnionSerde.F(record, out);
                        for (const [memberName, memberSchema] of ns.structIterator()){
                            let fromKey = memberName;
                            if (jsonName) {
                                fromKey = memberSchema.getMergedTraits().jsonName ?? fromKey;
                                nameMap[fromKey] = memberName;
                            }
                            if (union) unionSerde.mark(fromKey);
                            if (null != record[fromKey]) out[memberName] = this._read(memberSchema, record[fromKey]);
                        }
                        if (union) unionSerde.writeUnknown();
                        else if ("string" == typeof record.__type) for (const [k, v] of Object.entries(record)){
                            const t = jsonName ? nameMap[k] ?? k : k;
                            if (!(t in out)) out[t] = v;
                        }
                        return out;
                    }
                    if (Array.isArray(value) && ns.isListSchema()) {
                        const listMember = ns.getValueSchema();
                        const out = [];
                        for (const item of value)out.push(this._read(listMember, item));
                        return out;
                    }
                    if (ns.isMapSchema()) {
                        const mapMember = ns.getValueSchema();
                        const out = {};
                        for (const [_k, _v] of Object.entries(value))out[_k] = this._read(mapMember, _v);
                        return out;
                    }
                }
                if (ns.isBlobSchema() && "string" == typeof value) return (0, fromBase64.E)(value);
                const mediaType = ns.getMergedTraits().mediaType;
                if (ns.isStringSchema() && "string" == typeof value && mediaType) {
                    const isJson = "application/json" === mediaType || mediaType.endsWith("+json");
                    if (isJson) return lazy_json.A.from(value);
                    return value;
                }
                if (ns.isTimestampSchema() && null != value) {
                    const format = (0, determineTimestampFormat.V)(ns, this.settings);
                    switch(format){
                        case 5:
                            return (0, date_utils.t_)(value);
                        case 6:
                            return (0, date_utils.xE)(value);
                        case 7:
                            return (0, date_utils.l3)(value);
                        default:
                            console.warn("Missing timestamp format, parsing value with Date constructor:", value);
                            return new Date(value);
                    }
                }
                if (ns.isBigIntegerSchema() && ("number" == typeof value || "string" == typeof value)) return BigInt(value);
                if (ns.isBigDecimalSchema() && void 0 != value) {
                    if (value instanceof NumericValue.D) return value;
                    const untyped = value;
                    if ("bigDecimal" === untyped.type && "string" in untyped) return new NumericValue.D(untyped.string, untyped.type);
                    return new NumericValue.D(String(value), "bigDecimal");
                }
                if (ns.isNumericSchema() && "string" == typeof value) {
                    switch(value){
                        case "Infinity":
                            return 1 / 0;
                        case "-Infinity":
                            return -1 / 0;
                        case "NaN":
                            return 0 / 0;
                    }
                    return value;
                }
                if (ns.isDocumentSchema()) if (!isObject) return structuredClone(value);
                else {
                    const out = Array.isArray(value) ? [] : {};
                    for (const [k, v] of Object.entries(value))if (v instanceof NumericValue.D) out[k] = v;
                    else out[k] = this._read(ns, v);
                    return out;
                }
                return value;
            }
        }
        var v4 = __webpack_require__("../../../node_modules/.pnpm/@smithy+uuid@1.1.2/node_modules/@smithy/uuid/dist-es/v4.js");
        var toBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/toBase64.js");
        const NUMERIC_CONTROL_CHAR = String.fromCharCode(925);
        class JsonReplacer {
            values = new Map();
            counter = 0;
            stage = 0;
            createReplacer() {
                if (1 === this.stage) throw new Error("@aws-sdk/core/protocols - JsonReplacer already created.");
                if (2 === this.stage) throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
                this.stage = 1;
                return (key, value)=>{
                    if (value instanceof NumericValue.D) {
                        const v = `${NUMERIC_CONTROL_CHAR + "nv" + this.counter++}_` + value.string;
                        this.values.set(`"${v}"`, value.string);
                        return v;
                    }
                    if ("bigint" == typeof value) {
                        const s = value.toString();
                        const v = `${NUMERIC_CONTROL_CHAR + "b" + this.counter++}_` + s;
                        this.values.set(`"${v}"`, s);
                        return v;
                    }
                    return value;
                };
            }
            replaceInJson(json) {
                if (0 === this.stage) throw new Error("@aws-sdk/core/protocols - JsonReplacer not created yet.");
                if (2 === this.stage) throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
                this.stage = 2;
                if (0 === this.counter) return json;
                for (const [key, value] of this.values)json = json.replace(key, value);
                return json;
            }
        }
        class JsonShapeSerializer extends ConfigurableSerdeContext.B {
            settings;
            buffer;
            useReplacer = false;
            rootSchema;
            constructor(settings){
                super();
                this.settings = settings;
            }
            write(schema, value) {
                this.rootSchema = NormalizedSchema.l1.of(schema);
                this.buffer = this._write(this.rootSchema, value);
            }
            writeDiscriminatedDocument(schema, value) {
                this.write(schema, value);
                if ("object" == typeof this.buffer) this.buffer.__type = NormalizedSchema.l1.of(schema).getName(true);
            }
            flush() {
                const { rootSchema, useReplacer } = this;
                this.rootSchema = void 0;
                this.useReplacer = false;
                if (rootSchema?.isStructSchema() || rootSchema?.isDocumentSchema()) {
                    if (!useReplacer) return JSON.stringify(this.buffer);
                    const replacer = new JsonReplacer();
                    return replacer.replaceInJson(JSON.stringify(this.buffer, replacer.createReplacer(), 0));
                }
                return this.buffer;
            }
            _write(schema, value, container) {
                const isObject = null !== value && "object" == typeof value;
                const ns = NormalizedSchema.l1.of(schema);
                if (isObject) {
                    if (ns.isStructSchema()) {
                        const record = value;
                        const out = {};
                        const { jsonName } = this.settings;
                        let nameMap;
                        if (jsonName) nameMap = {};
                        for (const [memberName, memberSchema] of ns.structIterator()){
                            const serializableValue = this._write(memberSchema, record[memberName], ns);
                            if (void 0 !== serializableValue) {
                                let targetKey = memberName;
                                if (jsonName) {
                                    targetKey = memberSchema.getMergedTraits().jsonName ?? memberName;
                                    nameMap[memberName] = targetKey;
                                }
                                out[targetKey] = serializableValue;
                            }
                        }
                        if (ns.isUnionSchema() && 0 === Object.keys(out).length) {
                            const { $unknown } = record;
                            if (Array.isArray($unknown)) {
                                const [k, v] = $unknown;
                                out[k] = this._write(15, v);
                            }
                        } else if ("string" == typeof record.__type) for (const [k, v] of Object.entries(record)){
                            const targetKey = jsonName ? nameMap[k] ?? k : k;
                            if (!(targetKey in out)) out[targetKey] = this._write(15, v);
                        }
                        return out;
                    }
                    if (Array.isArray(value) && ns.isListSchema()) {
                        const listMember = ns.getValueSchema();
                        const out = [];
                        const sparse = !!ns.getMergedTraits().sparse;
                        for (const item of value)if (sparse || null != item) out.push(this._write(listMember, item));
                        return out;
                    }
                    if (ns.isMapSchema()) {
                        const mapMember = ns.getValueSchema();
                        const out = {};
                        const sparse = !!ns.getMergedTraits().sparse;
                        for (const [_k, _v] of Object.entries(value))if (sparse || null != _v) out[_k] = this._write(mapMember, _v);
                        return out;
                    }
                    if (value instanceof Uint8Array && (ns.isBlobSchema() || ns.isDocumentSchema())) {
                        if (ns === this.rootSchema) return value;
                        return (this.serdeContext?.base64Encoder ?? toBase64.n)(value);
                    }
                    if (value instanceof Date && (ns.isTimestampSchema() || ns.isDocumentSchema())) {
                        const format = (0, determineTimestampFormat.V)(ns, this.settings);
                        switch(format){
                            case 5:
                                return value.toISOString().replace(".000Z", "Z");
                            case 6:
                                return (0, date_utils.JV)(value);
                            case 7:
                                return value.getTime() / 1000;
                            default:
                                console.warn("Missing timestamp format, using epoch seconds", value);
                                return value.getTime() / 1000;
                        }
                    }
                    if (value instanceof NumericValue.D) this.useReplacer = true;
                }
                if (null === value && container?.isStructSchema()) return;
                if (ns.isStringSchema()) {
                    if (void 0 === value && ns.isIdempotencyToken()) return (0, v4.v4)();
                    const mediaType = ns.getMergedTraits().mediaType;
                    if (null != value && mediaType) {
                        const isJson = "application/json" === mediaType || mediaType.endsWith("+json");
                        if (isJson) return lazy_json.A.from(value);
                    }
                    return value;
                }
                if ("number" == typeof value && ns.isNumericSchema()) {
                    if (1 / 0 === Math.abs(value) || isNaN(value)) return String(value);
                    return value;
                }
                if ("string" == typeof value && ns.isBlobSchema()) {
                    if (ns === this.rootSchema) return value;
                    return (this.serdeContext?.base64Encoder ?? toBase64.n)(value);
                }
                if ("bigint" == typeof value) this.useReplacer = true;
                if (ns.isDocumentSchema()) if (!isObject) return structuredClone(value);
                else {
                    const out = Array.isArray(value) ? [] : {};
                    for (const [k, v] of Object.entries(value))if (v instanceof NumericValue.D) {
                        this.useReplacer = true;
                        out[k] = v;
                    } else out[k] = this._write(ns, v);
                    return out;
                }
                return value;
            }
        }
        class JsonCodec extends ConfigurableSerdeContext.B {
            settings;
            constructor(settings){
                super();
                this.settings = settings;
            }
            createSerializer() {
                const serializer = new JsonShapeSerializer(this.settings);
                serializer.setSerdeContext(this.serdeContext);
                return serializer;
            }
            createDeserializer() {
                const deserializer = new JsonShapeDeserializer(this.settings);
                deserializer.setSerdeContext(this.serdeContext);
                return deserializer;
            }
        }
        class AwsRestJsonProtocol extends HttpBindingProtocol.s {
            serializer;
            deserializer;
            codec;
            mixin = new ProtocolLib.U();
            constructor({ defaultNamespace, errorTypeRegistries }){
                super({
                    defaultNamespace,
                    errorTypeRegistries
                });
                const settings = {
                    timestampFormat: {
                        useTrait: true,
                        default: 7
                    },
                    httpBindings: true,
                    jsonName: true
                };
                this.codec = new JsonCodec(settings);
                this.serializer = new HttpInterceptingShapeSerializer._(this.codec.createSerializer(), settings);
                this.deserializer = new HttpInterceptingShapeDeserializer.z(this.codec.createDeserializer(), settings);
            }
            getShapeId() {
                return "aws.protocols#restJson1";
            }
            getPayloadCodec() {
                return this.codec;
            }
            setSerdeContext(serdeContext) {
                this.codec.setSerdeContext(serdeContext);
                super.setSerdeContext(serdeContext);
            }
            async serializeRequest(operationSchema, input, context) {
                const request = await super.serializeRequest(operationSchema, input, context);
                const inputSchema = NormalizedSchema.l1.of(operationSchema.input);
                if (!request.headers["content-type"]) {
                    const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
                    if (contentType) request.headers["content-type"] = contentType;
                }
                if (null == request.body && request.headers["content-type"] === this.getDefaultContentType()) request.body = "{}";
                return request;
            }
            async deserializeResponse(operationSchema, context, response) {
                const output = await super.deserializeResponse(operationSchema, context, response);
                const outputSchema = NormalizedSchema.l1.of(operationSchema.output);
                for (const [name, member] of outputSchema.structIterator())if (member.getMemberTraits().httpPayload && !(name in output)) output[name] = null;
                return output;
            }
            async handleError(operationSchema, context, response, dataObject, metadata) {
                const errorIdentifier = loadRestJsonErrorCode(response, dataObject) ?? "Unknown";
                this.mixin.compose(this.compositeErrorRegistry, errorIdentifier, this.options.defaultNamespace);
                const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
                const ns = NormalizedSchema.l1.of(errorSchema);
                const message = dataObject.message ?? dataObject.Message ?? "UnknownError";
                const ErrorCtor = this.compositeErrorRegistry.getErrorCtor(errorSchema) ?? Error;
                const exception = new ErrorCtor(message);
                await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
                const output = {};
                for (const [name, member] of ns.structIterator()){
                    const target = member.getMergedTraits().jsonName ?? name;
                    output[name] = this.codec.createDeserializer().readObject(member, dataObject[target]);
                }
                throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
                    $fault: ns.getMergedTraits().error,
                    message
                }, output), dataObject);
            }
            getDefaultContentType() {
                return "application/json";
            }
        }
    },
    "../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        class NoAuthSigner {
            async sign(httpRequest, identity, signingProperties) {
                return httpRequest;
            }
        }
        __webpack_require__.d(__webpack_exports__, {
            m: ()=>NoAuthSigner
        });
    },
    "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/package.json" (module) {
        module.exports = {
            rE: "3.996.17"
        };
    }
};
