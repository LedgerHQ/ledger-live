import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace ledger_trade. */
export namespace ledger_trade {
  /** Properties of a NewTransactionResponse. */
  interface INewTransactionResponse {
    /** NewTransactionResponse payinAddress */
    payinAddress?: string | null;

    /** NewTransactionResponse payinExtraId */
    payinExtraId?: string | null;

    /** NewTransactionResponse refundAddress */
    refundAddress?: string | null;

    /** NewTransactionResponse refundExtraId */
    refundExtraId?: string | null;

    /** NewTransactionResponse payoutAddress */
    payoutAddress?: string | null;

    /** NewTransactionResponse payoutExtraId */
    payoutExtraId?: string | null;

    /** NewTransactionResponse currencyFrom */
    currencyFrom?: string | null;

    /** NewTransactionResponse currencyTo */
    currencyTo?: string | null;

    /** NewTransactionResponse amountToProvider */
    amountToProvider?: Uint8Array | null;

    /** NewTransactionResponse amountToWallet */
    amountToWallet?: Uint8Array | null;

    /** NewTransactionResponse deviceTransactionId */
    deviceTransactionId?: string | null;

    /** NewTransactionResponse deviceTransactionIdNg */
    deviceTransactionIdNg?: Uint8Array | null;
  }

  /** Represents a NewTransactionResponse. */
  class NewTransactionResponse implements INewTransactionResponse {
    /**
     * Constructs a new NewTransactionResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.INewTransactionResponse);

    /** NewTransactionResponse payinAddress. */
    public payinAddress: string;

    /** NewTransactionResponse payinExtraId. */
    public payinExtraId: string;

    /** NewTransactionResponse refundAddress. */
    public refundAddress: string;

    /** NewTransactionResponse refundExtraId. */
    public refundExtraId: string;

    /** NewTransactionResponse payoutAddress. */
    public payoutAddress: string;

    /** NewTransactionResponse payoutExtraId. */
    public payoutExtraId: string;

    /** NewTransactionResponse currencyFrom. */
    public currencyFrom: string;

    /** NewTransactionResponse currencyTo. */
    public currencyTo: string;

    /** NewTransactionResponse amountToProvider. */
    public amountToProvider: Uint8Array;

    /** NewTransactionResponse amountToWallet. */
    public amountToWallet: Uint8Array;

    /** NewTransactionResponse deviceTransactionId. */
    public deviceTransactionId: string;

    /** NewTransactionResponse deviceTransactionIdNg. */
    public deviceTransactionIdNg: Uint8Array;

    /**
     * Creates a new NewTransactionResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewTransactionResponse instance
     */
    public static create(
      properties?: ledger_trade.INewTransactionResponse,
    ): ledger_trade.NewTransactionResponse;

    /**
     * Encodes the specified NewTransactionResponse message. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @param message NewTransactionResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: ledger_trade.INewTransactionResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewTransactionResponse message, length delimited. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @param message NewTransactionResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: ledger_trade.INewTransactionResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewTransactionResponse;

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewTransactionResponse;

    /**
     * Verifies a NewTransactionResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewTransactionResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewTransactionResponse
     */
    public static fromObject(object: { [k: string]: any }): ledger_trade.NewTransactionResponse;

    /**
     * Creates a plain object from a NewTransactionResponse message. Also converts values to other types if specified.
     * @param message NewTransactionResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: ledger_trade.NewTransactionResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewTransactionResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for NewTransactionResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a UDecimal. */
  interface IUDecimal {
    /** UDecimal coefficient */
    coefficient?: Uint8Array | null;

    /** UDecimal exponent */
    exponent?: number | null;
  }

  /** Represents a UDecimal. */
  class UDecimal implements IUDecimal {
    /**
     * Constructs a new UDecimal.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.IUDecimal);

    /** UDecimal coefficient. */
    public coefficient: Uint8Array;

    /** UDecimal exponent. */
    public exponent: number;

    /**
     * Creates a new UDecimal instance using the specified properties.
     * @param [properties] Properties to set
     * @returns UDecimal instance
     */
    public static create(properties?: ledger_trade.IUDecimal): ledger_trade.UDecimal;

    /**
     * Encodes the specified UDecimal message. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @param message UDecimal message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: ledger_trade.IUDecimal,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified UDecimal message, length delimited. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @param message UDecimal message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: ledger_trade.IUDecimal,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a UDecimal message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.UDecimal;

    /**
     * Decodes a UDecimal message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): ledger_trade.UDecimal;

    /**
     * Verifies a UDecimal message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a UDecimal message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UDecimal
     */
    public static fromObject(object: { [k: string]: any }): ledger_trade.UDecimal;

    /**
     * Creates a plain object from a UDecimal message. Also converts values to other types if specified.
     * @param message UDecimal
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: ledger_trade.UDecimal,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this UDecimal to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for UDecimal
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a NewSellResponse. */
  interface INewSellResponse {
    /** NewSellResponse traderEmail */
    traderEmail?: string | null;

    /** NewSellResponse inCurrency */
    inCurrency?: string | null;

    /** NewSellResponse inAmount */
    inAmount?: Uint8Array | null;

    /** NewSellResponse inAddress */
    inAddress?: string | null;

    /** NewSellResponse outCurrency */
    outCurrency?: string | null;

    /** NewSellResponse outAmount */
    outAmount?: ledger_trade.IUDecimal | null;

    /** NewSellResponse deviceTransactionId */
    deviceTransactionId?: Uint8Array | null;

    /** NewSellResponse inExtraId */
    inExtraId?: string | null;
  }

  /** Represents a NewSellResponse. */
  class NewSellResponse implements INewSellResponse {
    /**
     * Constructs a new NewSellResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.INewSellResponse);

    /** NewSellResponse traderEmail. */
    public traderEmail: string;

    /** NewSellResponse inCurrency. */
    public inCurrency: string;

    /** NewSellResponse inAmount. */
    public inAmount: Uint8Array;

    /** NewSellResponse inAddress. */
    public inAddress: string;

    /** NewSellResponse outCurrency. */
    public outCurrency: string;

    /** NewSellResponse outAmount. */
    public outAmount?: ledger_trade.IUDecimal | null;

    /** NewSellResponse deviceTransactionId. */
    public deviceTransactionId: Uint8Array;

    /** NewSellResponse inExtraId. */
    public inExtraId: string;

    /**
     * Creates a new NewSellResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewSellResponse instance
     */
    public static create(properties?: ledger_trade.INewSellResponse): ledger_trade.NewSellResponse;

    /**
     * Encodes the specified NewSellResponse message. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @param message NewSellResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: ledger_trade.INewSellResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewSellResponse message, length delimited. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @param message NewSellResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: ledger_trade.INewSellResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewSellResponse;

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewSellResponse;

    /**
     * Verifies a NewSellResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewSellResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewSellResponse
     */
    public static fromObject(object: { [k: string]: any }): ledger_trade.NewSellResponse;

    /**
     * Creates a plain object from a NewSellResponse message. Also converts values to other types if specified.
     * @param message NewSellResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: ledger_trade.NewSellResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewSellResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for NewSellResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a NewFundResponse. */
  interface INewFundResponse {
    /** NewFundResponse userId */
    userId?: string | null;

    /** NewFundResponse accountName */
    accountName?: string | null;

    /** NewFundResponse inCurrency */
    inCurrency?: string | null;

    /** NewFundResponse inAmount */
    inAmount?: Uint8Array | null;

    /** NewFundResponse inAddress */
    inAddress?: string | null;

    /** NewFundResponse deviceTransactionId */
    deviceTransactionId?: Uint8Array | null;

    /** NewFundResponse inExtraId */
    inExtraId?: string | null;
  }

  /** Represents a NewFundResponse. */
  class NewFundResponse implements INewFundResponse {
    /**
     * Constructs a new NewFundResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.INewFundResponse);

    /** NewFundResponse userId. */
    public userId: string;

    /** NewFundResponse accountName. */
    public accountName: string;

    /** NewFundResponse inCurrency. */
    public inCurrency: string;

    /** NewFundResponse inAmount. */
    public inAmount: Uint8Array;

    /** NewFundResponse inAddress. */
    public inAddress: string;

    /** NewFundResponse deviceTransactionId. */
    public deviceTransactionId: Uint8Array;

    /** NewFundResponse inExtraId. */
    public inExtraId: string;

    /**
     * Creates a new NewFundResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewFundResponse instance
     */
    public static create(properties?: ledger_trade.INewFundResponse): ledger_trade.NewFundResponse;

    /**
     * Encodes the specified NewFundResponse message. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @param message NewFundResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: ledger_trade.INewFundResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewFundResponse message, length delimited. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @param message NewFundResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: ledger_trade.INewFundResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewFundResponse;

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewFundResponse;

    /**
     * Verifies a NewFundResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewFundResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewFundResponse
     */
    public static fromObject(object: { [k: string]: any }): ledger_trade.NewFundResponse;

    /**
     * Creates a plain object from a NewFundResponse message. Also converts values to other types if specified.
     * @param message NewFundResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: ledger_trade.NewFundResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewFundResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for NewFundResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}
