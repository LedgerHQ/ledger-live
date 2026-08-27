/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots.ledger_trade || ($protobuf.roots.ledger_trade = {});

export const ledger_trade = ($root.ledger_trade = (() => {
  /**
   * Namespace ledger_trade.
   * @exports ledger_trade
   * @namespace
   */
  const ledger_trade = {};

  ledger_trade.NewTransactionResponse = (function () {
    /**
     * Properties of a NewTransactionResponse.
     * @memberof ledger_trade
     * @interface INewTransactionResponse
     * @property {string|null} [payinAddress] NewTransactionResponse payinAddress
     * @property {string|null} [payinExtraId] NewTransactionResponse payinExtraId
     * @property {string|null} [refundAddress] NewTransactionResponse refundAddress
     * @property {string|null} [refundExtraId] NewTransactionResponse refundExtraId
     * @property {string|null} [payoutAddress] NewTransactionResponse payoutAddress
     * @property {string|null} [payoutExtraId] NewTransactionResponse payoutExtraId
     * @property {string|null} [currencyFrom] NewTransactionResponse currencyFrom
     * @property {string|null} [currencyTo] NewTransactionResponse currencyTo
     * @property {Uint8Array|null} [amountToProvider] NewTransactionResponse amountToProvider
     * @property {Uint8Array|null} [amountToWallet] NewTransactionResponse amountToWallet
     * @property {string|null} [deviceTransactionId] NewTransactionResponse deviceTransactionId
     * @property {Uint8Array|null} [deviceTransactionIdNg] NewTransactionResponse deviceTransactionIdNg
     */

    /**
     * Constructs a new NewTransactionResponse.
     * @memberof ledger_trade
     * @classdesc Represents a NewTransactionResponse.
     * @implements INewTransactionResponse
     * @constructor
     * @param {ledger_trade.INewTransactionResponse=} [properties] Properties to set
     */
    function NewTransactionResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * NewTransactionResponse payinAddress.
     * @member {string} payinAddress
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.payinAddress = "";

    /**
     * NewTransactionResponse payinExtraId.
     * @member {string} payinExtraId
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.payinExtraId = "";

    /**
     * NewTransactionResponse refundAddress.
     * @member {string} refundAddress
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.refundAddress = "";

    /**
     * NewTransactionResponse refundExtraId.
     * @member {string} refundExtraId
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.refundExtraId = "";

    /**
     * NewTransactionResponse payoutAddress.
     * @member {string} payoutAddress
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.payoutAddress = "";

    /**
     * NewTransactionResponse payoutExtraId.
     * @member {string} payoutExtraId
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.payoutExtraId = "";

    /**
     * NewTransactionResponse currencyFrom.
     * @member {string} currencyFrom
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.currencyFrom = "";

    /**
     * NewTransactionResponse currencyTo.
     * @member {string} currencyTo
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.currencyTo = "";

    /**
     * NewTransactionResponse amountToProvider.
     * @member {Uint8Array} amountToProvider
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.amountToProvider = $util.newBuffer([]);

    /**
     * NewTransactionResponse amountToWallet.
     * @member {Uint8Array} amountToWallet
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.amountToWallet = $util.newBuffer([]);

    /**
     * NewTransactionResponse deviceTransactionId.
     * @member {string} deviceTransactionId
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.deviceTransactionId = "";

    /**
     * NewTransactionResponse deviceTransactionIdNg.
     * @member {Uint8Array} deviceTransactionIdNg
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     */
    NewTransactionResponse.prototype.deviceTransactionIdNg = $util.newBuffer([]);

    /**
     * Creates a new NewTransactionResponse instance using the specified properties.
     * @function create
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {ledger_trade.INewTransactionResponse=} [properties] Properties to set
     * @returns {ledger_trade.NewTransactionResponse} NewTransactionResponse instance
     */
    NewTransactionResponse.create = function create(properties) {
      return new NewTransactionResponse(properties);
    };

    /**
     * Encodes the specified NewTransactionResponse message. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @function encode
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {ledger_trade.INewTransactionResponse} message NewTransactionResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewTransactionResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.payinAddress != null && Object.hasOwnProperty.call(message, "payinAddress"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.payinAddress);
      if (message.payinExtraId != null && Object.hasOwnProperty.call(message, "payinExtraId"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.payinExtraId);
      if (message.refundAddress != null && Object.hasOwnProperty.call(message, "refundAddress"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.refundAddress);
      if (message.refundExtraId != null && Object.hasOwnProperty.call(message, "refundExtraId"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.refundExtraId);
      if (message.payoutAddress != null && Object.hasOwnProperty.call(message, "payoutAddress"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.payoutAddress);
      if (message.payoutExtraId != null && Object.hasOwnProperty.call(message, "payoutExtraId"))
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.payoutExtraId);
      if (message.currencyFrom != null && Object.hasOwnProperty.call(message, "currencyFrom"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.currencyFrom);
      if (message.currencyTo != null && Object.hasOwnProperty.call(message, "currencyTo"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.currencyTo);
      if (
        message.amountToProvider != null &&
        Object.hasOwnProperty.call(message, "amountToProvider")
      )
        writer.uint32(/* id 9, wireType 2 =*/ 74).bytes(message.amountToProvider);
      if (message.amountToWallet != null && Object.hasOwnProperty.call(message, "amountToWallet"))
        writer.uint32(/* id 10, wireType 2 =*/ 82).bytes(message.amountToWallet);
      if (
        message.deviceTransactionId != null &&
        Object.hasOwnProperty.call(message, "deviceTransactionId")
      )
        writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.deviceTransactionId);
      if (
        message.deviceTransactionIdNg != null &&
        Object.hasOwnProperty.call(message, "deviceTransactionIdNg")
      )
        writer.uint32(/* id 12, wireType 2 =*/ 98).bytes(message.deviceTransactionIdNg);
      return writer;
    };

    /**
     * Encodes the specified NewTransactionResponse message, length delimited. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {ledger_trade.INewTransactionResponse} message NewTransactionResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewTransactionResponse.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer.
     * @function decode
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ledger_trade.NewTransactionResponse} NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewTransactionResponse.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.ledger_trade.NewTransactionResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.payinAddress = reader.string();
            break;
          }
          case 2: {
            message.payinExtraId = reader.string();
            break;
          }
          case 3: {
            message.refundAddress = reader.string();
            break;
          }
          case 4: {
            message.refundExtraId = reader.string();
            break;
          }
          case 5: {
            message.payoutAddress = reader.string();
            break;
          }
          case 6: {
            message.payoutExtraId = reader.string();
            break;
          }
          case 7: {
            message.currencyFrom = reader.string();
            break;
          }
          case 8: {
            message.currencyTo = reader.string();
            break;
          }
          case 9: {
            message.amountToProvider = reader.bytes();
            break;
          }
          case 10: {
            message.amountToWallet = reader.bytes();
            break;
          }
          case 11: {
            message.deviceTransactionId = reader.string();
            break;
          }
          case 12: {
            message.deviceTransactionIdNg = reader.bytes();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ledger_trade.NewTransactionResponse} NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewTransactionResponse.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NewTransactionResponse message.
     * @function verify
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NewTransactionResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.payinAddress != null && message.hasOwnProperty("payinAddress"))
        if (!$util.isString(message.payinAddress)) return "payinAddress: string expected";
      if (message.payinExtraId != null && message.hasOwnProperty("payinExtraId"))
        if (!$util.isString(message.payinExtraId)) return "payinExtraId: string expected";
      if (message.refundAddress != null && message.hasOwnProperty("refundAddress"))
        if (!$util.isString(message.refundAddress)) return "refundAddress: string expected";
      if (message.refundExtraId != null && message.hasOwnProperty("refundExtraId"))
        if (!$util.isString(message.refundExtraId)) return "refundExtraId: string expected";
      if (message.payoutAddress != null && message.hasOwnProperty("payoutAddress"))
        if (!$util.isString(message.payoutAddress)) return "payoutAddress: string expected";
      if (message.payoutExtraId != null && message.hasOwnProperty("payoutExtraId"))
        if (!$util.isString(message.payoutExtraId)) return "payoutExtraId: string expected";
      if (message.currencyFrom != null && message.hasOwnProperty("currencyFrom"))
        if (!$util.isString(message.currencyFrom)) return "currencyFrom: string expected";
      if (message.currencyTo != null && message.hasOwnProperty("currencyTo"))
        if (!$util.isString(message.currencyTo)) return "currencyTo: string expected";
      if (message.amountToProvider != null && message.hasOwnProperty("amountToProvider"))
        if (
          !(
            (message.amountToProvider && typeof message.amountToProvider.length === "number") ||
            $util.isString(message.amountToProvider)
          )
        )
          return "amountToProvider: buffer expected";
      if (message.amountToWallet != null && message.hasOwnProperty("amountToWallet"))
        if (
          !(
            (message.amountToWallet && typeof message.amountToWallet.length === "number") ||
            $util.isString(message.amountToWallet)
          )
        )
          return "amountToWallet: buffer expected";
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        if (!$util.isString(message.deviceTransactionId))
          return "deviceTransactionId: string expected";
      if (message.deviceTransactionIdNg != null && message.hasOwnProperty("deviceTransactionIdNg"))
        if (
          !(
            (message.deviceTransactionIdNg &&
              typeof message.deviceTransactionIdNg.length === "number") ||
            $util.isString(message.deviceTransactionIdNg)
          )
        )
          return "deviceTransactionIdNg: buffer expected";
      return null;
    };

    /**
     * Creates a NewTransactionResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ledger_trade.NewTransactionResponse} NewTransactionResponse
     */
    NewTransactionResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.ledger_trade.NewTransactionResponse) return object;
      let message = new $root.ledger_trade.NewTransactionResponse();
      if (object.payinAddress != null) message.payinAddress = String(object.payinAddress);
      if (object.payinExtraId != null) message.payinExtraId = String(object.payinExtraId);
      if (object.refundAddress != null) message.refundAddress = String(object.refundAddress);
      if (object.refundExtraId != null) message.refundExtraId = String(object.refundExtraId);
      if (object.payoutAddress != null) message.payoutAddress = String(object.payoutAddress);
      if (object.payoutExtraId != null) message.payoutExtraId = String(object.payoutExtraId);
      if (object.currencyFrom != null) message.currencyFrom = String(object.currencyFrom);
      if (object.currencyTo != null) message.currencyTo = String(object.currencyTo);
      if (object.amountToProvider != null)
        if (typeof object.amountToProvider === "string")
          $util.base64.decode(
            object.amountToProvider,
            (message.amountToProvider = $util.newBuffer(
              $util.base64.length(object.amountToProvider),
            )),
            0,
          );
        else if (object.amountToProvider.length >= 0)
          message.amountToProvider = object.amountToProvider;
      if (object.amountToWallet != null)
        if (typeof object.amountToWallet === "string")
          $util.base64.decode(
            object.amountToWallet,
            (message.amountToWallet = $util.newBuffer($util.base64.length(object.amountToWallet))),
            0,
          );
        else if (object.amountToWallet.length >= 0) message.amountToWallet = object.amountToWallet;
      if (object.deviceTransactionId != null)
        message.deviceTransactionId = String(object.deviceTransactionId);
      if (object.deviceTransactionIdNg != null)
        if (typeof object.deviceTransactionIdNg === "string")
          $util.base64.decode(
            object.deviceTransactionIdNg,
            (message.deviceTransactionIdNg = $util.newBuffer(
              $util.base64.length(object.deviceTransactionIdNg),
            )),
            0,
          );
        else if (object.deviceTransactionIdNg.length >= 0)
          message.deviceTransactionIdNg = object.deviceTransactionIdNg;
      return message;
    };

    /**
     * Creates a plain object from a NewTransactionResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {ledger_trade.NewTransactionResponse} message NewTransactionResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NewTransactionResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.payinAddress = "";
        object.payinExtraId = "";
        object.refundAddress = "";
        object.refundExtraId = "";
        object.payoutAddress = "";
        object.payoutExtraId = "";
        object.currencyFrom = "";
        object.currencyTo = "";
        if (options.bytes === String) object.amountToProvider = "";
        else {
          object.amountToProvider = [];
          if (options.bytes !== Array)
            object.amountToProvider = $util.newBuffer(object.amountToProvider);
        }
        if (options.bytes === String) object.amountToWallet = "";
        else {
          object.amountToWallet = [];
          if (options.bytes !== Array)
            object.amountToWallet = $util.newBuffer(object.amountToWallet);
        }
        object.deviceTransactionId = "";
        if (options.bytes === String) object.deviceTransactionIdNg = "";
        else {
          object.deviceTransactionIdNg = [];
          if (options.bytes !== Array)
            object.deviceTransactionIdNg = $util.newBuffer(object.deviceTransactionIdNg);
        }
      }
      if (message.payinAddress != null && message.hasOwnProperty("payinAddress"))
        object.payinAddress = message.payinAddress;
      if (message.payinExtraId != null && message.hasOwnProperty("payinExtraId"))
        object.payinExtraId = message.payinExtraId;
      if (message.refundAddress != null && message.hasOwnProperty("refundAddress"))
        object.refundAddress = message.refundAddress;
      if (message.refundExtraId != null && message.hasOwnProperty("refundExtraId"))
        object.refundExtraId = message.refundExtraId;
      if (message.payoutAddress != null && message.hasOwnProperty("payoutAddress"))
        object.payoutAddress = message.payoutAddress;
      if (message.payoutExtraId != null && message.hasOwnProperty("payoutExtraId"))
        object.payoutExtraId = message.payoutExtraId;
      if (message.currencyFrom != null && message.hasOwnProperty("currencyFrom"))
        object.currencyFrom = message.currencyFrom;
      if (message.currencyTo != null && message.hasOwnProperty("currencyTo"))
        object.currencyTo = message.currencyTo;
      if (message.amountToProvider != null && message.hasOwnProperty("amountToProvider"))
        object.amountToProvider =
          options.bytes === String
            ? $util.base64.encode(message.amountToProvider, 0, message.amountToProvider.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.amountToProvider)
              : message.amountToProvider;
      if (message.amountToWallet != null && message.hasOwnProperty("amountToWallet"))
        object.amountToWallet =
          options.bytes === String
            ? $util.base64.encode(message.amountToWallet, 0, message.amountToWallet.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.amountToWallet)
              : message.amountToWallet;
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        object.deviceTransactionId = message.deviceTransactionId;
      if (message.deviceTransactionIdNg != null && message.hasOwnProperty("deviceTransactionIdNg"))
        object.deviceTransactionIdNg =
          options.bytes === String
            ? $util.base64.encode(
                message.deviceTransactionIdNg,
                0,
                message.deviceTransactionIdNg.length,
              )
            : options.bytes === Array
              ? Array.prototype.slice.call(message.deviceTransactionIdNg)
              : message.deviceTransactionIdNg;
      return object;
    };

    /**
     * Converts this NewTransactionResponse to JSON.
     * @function toJSON
     * @memberof ledger_trade.NewTransactionResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NewTransactionResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NewTransactionResponse
     * @function getTypeUrl
     * @memberof ledger_trade.NewTransactionResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NewTransactionResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/ledger_trade.NewTransactionResponse";
    };

    return NewTransactionResponse;
  })();

  ledger_trade.UDecimal = (function () {
    /**
     * Properties of a UDecimal.
     * @memberof ledger_trade
     * @interface IUDecimal
     * @property {Uint8Array|null} [coefficient] UDecimal coefficient
     * @property {number|null} [exponent] UDecimal exponent
     */

    /**
     * Constructs a new UDecimal.
     * @memberof ledger_trade
     * @classdesc Represents a UDecimal.
     * @implements IUDecimal
     * @constructor
     * @param {ledger_trade.IUDecimal=} [properties] Properties to set
     */
    function UDecimal(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * UDecimal coefficient.
     * @member {Uint8Array} coefficient
     * @memberof ledger_trade.UDecimal
     * @instance
     */
    UDecimal.prototype.coefficient = $util.newBuffer([]);

    /**
     * UDecimal exponent.
     * @member {number} exponent
     * @memberof ledger_trade.UDecimal
     * @instance
     */
    UDecimal.prototype.exponent = 0;

    /**
     * Creates a new UDecimal instance using the specified properties.
     * @function create
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {ledger_trade.IUDecimal=} [properties] Properties to set
     * @returns {ledger_trade.UDecimal} UDecimal instance
     */
    UDecimal.create = function create(properties) {
      return new UDecimal(properties);
    };

    /**
     * Encodes the specified UDecimal message. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @function encode
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {ledger_trade.IUDecimal} message UDecimal message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UDecimal.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.coefficient != null && Object.hasOwnProperty.call(message, "coefficient"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.coefficient);
      if (message.exponent != null && Object.hasOwnProperty.call(message, "exponent"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.exponent);
      return writer;
    };

    /**
     * Encodes the specified UDecimal message, length delimited. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {ledger_trade.IUDecimal} message UDecimal message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UDecimal.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a UDecimal message from the specified reader or buffer.
     * @function decode
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ledger_trade.UDecimal} UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UDecimal.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.ledger_trade.UDecimal();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.coefficient = reader.bytes();
            break;
          }
          case 2: {
            message.exponent = reader.uint32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a UDecimal message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ledger_trade.UDecimal} UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UDecimal.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a UDecimal message.
     * @function verify
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UDecimal.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.coefficient != null && message.hasOwnProperty("coefficient"))
        if (
          !(
            (message.coefficient && typeof message.coefficient.length === "number") ||
            $util.isString(message.coefficient)
          )
        )
          return "coefficient: buffer expected";
      if (message.exponent != null && message.hasOwnProperty("exponent"))
        if (!$util.isInteger(message.exponent)) return "exponent: integer expected";
      return null;
    };

    /**
     * Creates a UDecimal message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ledger_trade.UDecimal} UDecimal
     */
    UDecimal.fromObject = function fromObject(object) {
      if (object instanceof $root.ledger_trade.UDecimal) return object;
      let message = new $root.ledger_trade.UDecimal();
      if (object.coefficient != null)
        if (typeof object.coefficient === "string")
          $util.base64.decode(
            object.coefficient,
            (message.coefficient = $util.newBuffer($util.base64.length(object.coefficient))),
            0,
          );
        else if (object.coefficient.length >= 0) message.coefficient = object.coefficient;
      if (object.exponent != null) message.exponent = object.exponent >>> 0;
      return message;
    };

    /**
     * Creates a plain object from a UDecimal message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {ledger_trade.UDecimal} message UDecimal
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UDecimal.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        if (options.bytes === String) object.coefficient = "";
        else {
          object.coefficient = [];
          if (options.bytes !== Array) object.coefficient = $util.newBuffer(object.coefficient);
        }
        object.exponent = 0;
      }
      if (message.coefficient != null && message.hasOwnProperty("coefficient"))
        object.coefficient =
          options.bytes === String
            ? $util.base64.encode(message.coefficient, 0, message.coefficient.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.coefficient)
              : message.coefficient;
      if (message.exponent != null && message.hasOwnProperty("exponent"))
        object.exponent = message.exponent;
      return object;
    };

    /**
     * Converts this UDecimal to JSON.
     * @function toJSON
     * @memberof ledger_trade.UDecimal
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UDecimal.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UDecimal
     * @function getTypeUrl
     * @memberof ledger_trade.UDecimal
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UDecimal.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/ledger_trade.UDecimal";
    };

    return UDecimal;
  })();

  ledger_trade.NewSellResponse = (function () {
    /**
     * Properties of a NewSellResponse.
     * @memberof ledger_trade
     * @interface INewSellResponse
     * @property {string|null} [traderEmail] NewSellResponse traderEmail
     * @property {string|null} [inCurrency] NewSellResponse inCurrency
     * @property {Uint8Array|null} [inAmount] NewSellResponse inAmount
     * @property {string|null} [inAddress] NewSellResponse inAddress
     * @property {string|null} [outCurrency] NewSellResponse outCurrency
     * @property {ledger_trade.IUDecimal|null} [outAmount] NewSellResponse outAmount
     * @property {Uint8Array|null} [deviceTransactionId] NewSellResponse deviceTransactionId
     * @property {string|null} [inExtraId] NewSellResponse inExtraId
     */

    /**
     * Constructs a new NewSellResponse.
     * @memberof ledger_trade
     * @classdesc Represents a NewSellResponse.
     * @implements INewSellResponse
     * @constructor
     * @param {ledger_trade.INewSellResponse=} [properties] Properties to set
     */
    function NewSellResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * NewSellResponse traderEmail.
     * @member {string} traderEmail
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.traderEmail = "";

    /**
     * NewSellResponse inCurrency.
     * @member {string} inCurrency
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.inCurrency = "";

    /**
     * NewSellResponse inAmount.
     * @member {Uint8Array} inAmount
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.inAmount = $util.newBuffer([]);

    /**
     * NewSellResponse inAddress.
     * @member {string} inAddress
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.inAddress = "";

    /**
     * NewSellResponse outCurrency.
     * @member {string} outCurrency
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.outCurrency = "";

    /**
     * NewSellResponse outAmount.
     * @member {ledger_trade.IUDecimal|null|undefined} outAmount
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.outAmount = null;

    /**
     * NewSellResponse deviceTransactionId.
     * @member {Uint8Array} deviceTransactionId
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.deviceTransactionId = $util.newBuffer([]);

    /**
     * NewSellResponse inExtraId.
     * @member {string} inExtraId
     * @memberof ledger_trade.NewSellResponse
     * @instance
     */
    NewSellResponse.prototype.inExtraId = "";

    /**
     * Creates a new NewSellResponse instance using the specified properties.
     * @function create
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {ledger_trade.INewSellResponse=} [properties] Properties to set
     * @returns {ledger_trade.NewSellResponse} NewSellResponse instance
     */
    NewSellResponse.create = function create(properties) {
      return new NewSellResponse(properties);
    };

    /**
     * Encodes the specified NewSellResponse message. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @function encode
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {ledger_trade.INewSellResponse} message NewSellResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewSellResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.traderEmail != null && Object.hasOwnProperty.call(message, "traderEmail"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.traderEmail);
      if (message.inCurrency != null && Object.hasOwnProperty.call(message, "inCurrency"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.inCurrency);
      if (message.inAmount != null && Object.hasOwnProperty.call(message, "inAmount"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).bytes(message.inAmount);
      if (message.inAddress != null && Object.hasOwnProperty.call(message, "inAddress"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.inAddress);
      if (message.outCurrency != null && Object.hasOwnProperty.call(message, "outCurrency"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.outCurrency);
      if (message.outAmount != null && Object.hasOwnProperty.call(message, "outAmount"))
        $root.ledger_trade.UDecimal.encode(
          message.outAmount,
          writer.uint32(/* id 6, wireType 2 =*/ 50).fork(),
        ).ldelim();
      if (
        message.deviceTransactionId != null &&
        Object.hasOwnProperty.call(message, "deviceTransactionId")
      )
        writer.uint32(/* id 7, wireType 2 =*/ 58).bytes(message.deviceTransactionId);
      if (message.inExtraId != null && Object.hasOwnProperty.call(message, "inExtraId"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.inExtraId);
      return writer;
    };

    /**
     * Encodes the specified NewSellResponse message, length delimited. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {ledger_trade.INewSellResponse} message NewSellResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewSellResponse.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer.
     * @function decode
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ledger_trade.NewSellResponse} NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewSellResponse.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.ledger_trade.NewSellResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.traderEmail = reader.string();
            break;
          }
          case 2: {
            message.inCurrency = reader.string();
            break;
          }
          case 3: {
            message.inAmount = reader.bytes();
            break;
          }
          case 4: {
            message.inAddress = reader.string();
            break;
          }
          case 5: {
            message.outCurrency = reader.string();
            break;
          }
          case 6: {
            message.outAmount = $root.ledger_trade.UDecimal.decode(reader, reader.uint32());
            break;
          }
          case 7: {
            message.deviceTransactionId = reader.bytes();
            break;
          }
          case 8: {
            message.inExtraId = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ledger_trade.NewSellResponse} NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewSellResponse.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NewSellResponse message.
     * @function verify
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NewSellResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.traderEmail != null && message.hasOwnProperty("traderEmail"))
        if (!$util.isString(message.traderEmail)) return "traderEmail: string expected";
      if (message.inCurrency != null && message.hasOwnProperty("inCurrency"))
        if (!$util.isString(message.inCurrency)) return "inCurrency: string expected";
      if (message.inAmount != null && message.hasOwnProperty("inAmount"))
        if (
          !(
            (message.inAmount && typeof message.inAmount.length === "number") ||
            $util.isString(message.inAmount)
          )
        )
          return "inAmount: buffer expected";
      if (message.inAddress != null && message.hasOwnProperty("inAddress"))
        if (!$util.isString(message.inAddress)) return "inAddress: string expected";
      if (message.outCurrency != null && message.hasOwnProperty("outCurrency"))
        if (!$util.isString(message.outCurrency)) return "outCurrency: string expected";
      if (message.outAmount != null && message.hasOwnProperty("outAmount")) {
        let error = $root.ledger_trade.UDecimal.verify(message.outAmount);
        if (error) return "outAmount." + error;
      }
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        if (
          !(
            (message.deviceTransactionId &&
              typeof message.deviceTransactionId.length === "number") ||
            $util.isString(message.deviceTransactionId)
          )
        )
          return "deviceTransactionId: buffer expected";
      if (message.inExtraId != null && message.hasOwnProperty("inExtraId"))
        if (!$util.isString(message.inExtraId)) return "inExtraId: string expected";
      return null;
    };

    /**
     * Creates a NewSellResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ledger_trade.NewSellResponse} NewSellResponse
     */
    NewSellResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.ledger_trade.NewSellResponse) return object;
      let message = new $root.ledger_trade.NewSellResponse();
      if (object.traderEmail != null) message.traderEmail = String(object.traderEmail);
      if (object.inCurrency != null) message.inCurrency = String(object.inCurrency);
      if (object.inAmount != null)
        if (typeof object.inAmount === "string")
          $util.base64.decode(
            object.inAmount,
            (message.inAmount = $util.newBuffer($util.base64.length(object.inAmount))),
            0,
          );
        else if (object.inAmount.length >= 0) message.inAmount = object.inAmount;
      if (object.inAddress != null) message.inAddress = String(object.inAddress);
      if (object.outCurrency != null) message.outCurrency = String(object.outCurrency);
      if (object.outAmount != null) {
        if (typeof object.outAmount !== "object")
          throw TypeError(".ledger_trade.NewSellResponse.outAmount: object expected");
        message.outAmount = $root.ledger_trade.UDecimal.fromObject(object.outAmount);
      }
      if (object.deviceTransactionId != null)
        if (typeof object.deviceTransactionId === "string")
          $util.base64.decode(
            object.deviceTransactionId,
            (message.deviceTransactionId = $util.newBuffer(
              $util.base64.length(object.deviceTransactionId),
            )),
            0,
          );
        else if (object.deviceTransactionId.length >= 0)
          message.deviceTransactionId = object.deviceTransactionId;
      if (object.inExtraId != null) message.inExtraId = String(object.inExtraId);
      return message;
    };

    /**
     * Creates a plain object from a NewSellResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {ledger_trade.NewSellResponse} message NewSellResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NewSellResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.traderEmail = "";
        object.inCurrency = "";
        if (options.bytes === String) object.inAmount = "";
        else {
          object.inAmount = [];
          if (options.bytes !== Array) object.inAmount = $util.newBuffer(object.inAmount);
        }
        object.inAddress = "";
        object.outCurrency = "";
        object.outAmount = null;
        if (options.bytes === String) object.deviceTransactionId = "";
        else {
          object.deviceTransactionId = [];
          if (options.bytes !== Array)
            object.deviceTransactionId = $util.newBuffer(object.deviceTransactionId);
        }
        object.inExtraId = "";
      }
      if (message.traderEmail != null && message.hasOwnProperty("traderEmail"))
        object.traderEmail = message.traderEmail;
      if (message.inCurrency != null && message.hasOwnProperty("inCurrency"))
        object.inCurrency = message.inCurrency;
      if (message.inAmount != null && message.hasOwnProperty("inAmount"))
        object.inAmount =
          options.bytes === String
            ? $util.base64.encode(message.inAmount, 0, message.inAmount.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.inAmount)
              : message.inAmount;
      if (message.inAddress != null && message.hasOwnProperty("inAddress"))
        object.inAddress = message.inAddress;
      if (message.outCurrency != null && message.hasOwnProperty("outCurrency"))
        object.outCurrency = message.outCurrency;
      if (message.outAmount != null && message.hasOwnProperty("outAmount"))
        object.outAmount = $root.ledger_trade.UDecimal.toObject(message.outAmount, options);
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        object.deviceTransactionId =
          options.bytes === String
            ? $util.base64.encode(
                message.deviceTransactionId,
                0,
                message.deviceTransactionId.length,
              )
            : options.bytes === Array
              ? Array.prototype.slice.call(message.deviceTransactionId)
              : message.deviceTransactionId;
      if (message.inExtraId != null && message.hasOwnProperty("inExtraId"))
        object.inExtraId = message.inExtraId;
      return object;
    };

    /**
     * Converts this NewSellResponse to JSON.
     * @function toJSON
     * @memberof ledger_trade.NewSellResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NewSellResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NewSellResponse
     * @function getTypeUrl
     * @memberof ledger_trade.NewSellResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NewSellResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/ledger_trade.NewSellResponse";
    };

    return NewSellResponse;
  })();

  ledger_trade.NewFundResponse = (function () {
    /**
     * Properties of a NewFundResponse.
     * @memberof ledger_trade
     * @interface INewFundResponse
     * @property {string|null} [userId] NewFundResponse userId
     * @property {string|null} [accountName] NewFundResponse accountName
     * @property {string|null} [inCurrency] NewFundResponse inCurrency
     * @property {Uint8Array|null} [inAmount] NewFundResponse inAmount
     * @property {string|null} [inAddress] NewFundResponse inAddress
     * @property {Uint8Array|null} [deviceTransactionId] NewFundResponse deviceTransactionId
     * @property {string|null} [inExtraId] NewFundResponse inExtraId
     */

    /**
     * Constructs a new NewFundResponse.
     * @memberof ledger_trade
     * @classdesc Represents a NewFundResponse.
     * @implements INewFundResponse
     * @constructor
     * @param {ledger_trade.INewFundResponse=} [properties] Properties to set
     */
    function NewFundResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * NewFundResponse userId.
     * @member {string} userId
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.userId = "";

    /**
     * NewFundResponse accountName.
     * @member {string} accountName
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.accountName = "";

    /**
     * NewFundResponse inCurrency.
     * @member {string} inCurrency
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.inCurrency = "";

    /**
     * NewFundResponse inAmount.
     * @member {Uint8Array} inAmount
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.inAmount = $util.newBuffer([]);

    /**
     * NewFundResponse inAddress.
     * @member {string} inAddress
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.inAddress = "";

    /**
     * NewFundResponse deviceTransactionId.
     * @member {Uint8Array} deviceTransactionId
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.deviceTransactionId = $util.newBuffer([]);

    /**
     * NewFundResponse inExtraId.
     * @member {string} inExtraId
     * @memberof ledger_trade.NewFundResponse
     * @instance
     */
    NewFundResponse.prototype.inExtraId = "";

    /**
     * Creates a new NewFundResponse instance using the specified properties.
     * @function create
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {ledger_trade.INewFundResponse=} [properties] Properties to set
     * @returns {ledger_trade.NewFundResponse} NewFundResponse instance
     */
    NewFundResponse.create = function create(properties) {
      return new NewFundResponse(properties);
    };

    /**
     * Encodes the specified NewFundResponse message. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @function encode
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {ledger_trade.INewFundResponse} message NewFundResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewFundResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.userId);
      if (message.accountName != null && Object.hasOwnProperty.call(message, "accountName"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.accountName);
      if (message.inCurrency != null && Object.hasOwnProperty.call(message, "inCurrency"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.inCurrency);
      if (message.inAmount != null && Object.hasOwnProperty.call(message, "inAmount"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).bytes(message.inAmount);
      if (message.inAddress != null && Object.hasOwnProperty.call(message, "inAddress"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.inAddress);
      if (
        message.deviceTransactionId != null &&
        Object.hasOwnProperty.call(message, "deviceTransactionId")
      )
        writer.uint32(/* id 6, wireType 2 =*/ 50).bytes(message.deviceTransactionId);
      if (message.inExtraId != null && Object.hasOwnProperty.call(message, "inExtraId"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.inExtraId);
      return writer;
    };

    /**
     * Encodes the specified NewFundResponse message, length delimited. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {ledger_trade.INewFundResponse} message NewFundResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewFundResponse.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer.
     * @function decode
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ledger_trade.NewFundResponse} NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewFundResponse.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.ledger_trade.NewFundResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.userId = reader.string();
            break;
          }
          case 2: {
            message.accountName = reader.string();
            break;
          }
          case 3: {
            message.inCurrency = reader.string();
            break;
          }
          case 4: {
            message.inAmount = reader.bytes();
            break;
          }
          case 5: {
            message.inAddress = reader.string();
            break;
          }
          case 6: {
            message.deviceTransactionId = reader.bytes();
            break;
          }
          case 7: {
            message.inExtraId = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ledger_trade.NewFundResponse} NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewFundResponse.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NewFundResponse message.
     * @function verify
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NewFundResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.userId != null && message.hasOwnProperty("userId"))
        if (!$util.isString(message.userId)) return "userId: string expected";
      if (message.accountName != null && message.hasOwnProperty("accountName"))
        if (!$util.isString(message.accountName)) return "accountName: string expected";
      if (message.inCurrency != null && message.hasOwnProperty("inCurrency"))
        if (!$util.isString(message.inCurrency)) return "inCurrency: string expected";
      if (message.inAmount != null && message.hasOwnProperty("inAmount"))
        if (
          !(
            (message.inAmount && typeof message.inAmount.length === "number") ||
            $util.isString(message.inAmount)
          )
        )
          return "inAmount: buffer expected";
      if (message.inAddress != null && message.hasOwnProperty("inAddress"))
        if (!$util.isString(message.inAddress)) return "inAddress: string expected";
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        if (
          !(
            (message.deviceTransactionId &&
              typeof message.deviceTransactionId.length === "number") ||
            $util.isString(message.deviceTransactionId)
          )
        )
          return "deviceTransactionId: buffer expected";
      if (message.inExtraId != null && message.hasOwnProperty("inExtraId"))
        if (!$util.isString(message.inExtraId)) return "inExtraId: string expected";
      return null;
    };

    /**
     * Creates a NewFundResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ledger_trade.NewFundResponse} NewFundResponse
     */
    NewFundResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.ledger_trade.NewFundResponse) return object;
      let message = new $root.ledger_trade.NewFundResponse();
      if (object.userId != null) message.userId = String(object.userId);
      if (object.accountName != null) message.accountName = String(object.accountName);
      if (object.inCurrency != null) message.inCurrency = String(object.inCurrency);
      if (object.inAmount != null)
        if (typeof object.inAmount === "string")
          $util.base64.decode(
            object.inAmount,
            (message.inAmount = $util.newBuffer($util.base64.length(object.inAmount))),
            0,
          );
        else if (object.inAmount.length >= 0) message.inAmount = object.inAmount;
      if (object.inAddress != null) message.inAddress = String(object.inAddress);
      if (object.deviceTransactionId != null)
        if (typeof object.deviceTransactionId === "string")
          $util.base64.decode(
            object.deviceTransactionId,
            (message.deviceTransactionId = $util.newBuffer(
              $util.base64.length(object.deviceTransactionId),
            )),
            0,
          );
        else if (object.deviceTransactionId.length >= 0)
          message.deviceTransactionId = object.deviceTransactionId;
      if (object.inExtraId != null) message.inExtraId = String(object.inExtraId);
      return message;
    };

    /**
     * Creates a plain object from a NewFundResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {ledger_trade.NewFundResponse} message NewFundResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NewFundResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.userId = "";
        object.accountName = "";
        object.inCurrency = "";
        if (options.bytes === String) object.inAmount = "";
        else {
          object.inAmount = [];
          if (options.bytes !== Array) object.inAmount = $util.newBuffer(object.inAmount);
        }
        object.inAddress = "";
        if (options.bytes === String) object.deviceTransactionId = "";
        else {
          object.deviceTransactionId = [];
          if (options.bytes !== Array)
            object.deviceTransactionId = $util.newBuffer(object.deviceTransactionId);
        }
        object.inExtraId = "";
      }
      if (message.userId != null && message.hasOwnProperty("userId"))
        object.userId = message.userId;
      if (message.accountName != null && message.hasOwnProperty("accountName"))
        object.accountName = message.accountName;
      if (message.inCurrency != null && message.hasOwnProperty("inCurrency"))
        object.inCurrency = message.inCurrency;
      if (message.inAmount != null && message.hasOwnProperty("inAmount"))
        object.inAmount =
          options.bytes === String
            ? $util.base64.encode(message.inAmount, 0, message.inAmount.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.inAmount)
              : message.inAmount;
      if (message.inAddress != null && message.hasOwnProperty("inAddress"))
        object.inAddress = message.inAddress;
      if (message.deviceTransactionId != null && message.hasOwnProperty("deviceTransactionId"))
        object.deviceTransactionId =
          options.bytes === String
            ? $util.base64.encode(
                message.deviceTransactionId,
                0,
                message.deviceTransactionId.length,
              )
            : options.bytes === Array
              ? Array.prototype.slice.call(message.deviceTransactionId)
              : message.deviceTransactionId;
      if (message.inExtraId != null && message.hasOwnProperty("inExtraId"))
        object.inExtraId = message.inExtraId;
      return object;
    };

    /**
     * Converts this NewFundResponse to JSON.
     * @function toJSON
     * @memberof ledger_trade.NewFundResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NewFundResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NewFundResponse
     * @function getTypeUrl
     * @memberof ledger_trade.NewFundResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NewFundResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/ledger_trade.NewFundResponse";
    };

    return NewFundResponse;
  })();

  return ledger_trade;
})());

export { $root as default };
