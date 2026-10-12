import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace ledger_trade. */
export namespace ledger_trade {
  /**
   * Properties of a NewTransactionResponse.
   * @deprecated Use ledger_trade.NewTransactionResponse.$Properties instead.
   */
  interface INewTransactionResponse extends ledger_trade.NewTransactionResponse.$Properties {}

  /** Represents a NewTransactionResponse. */
  class NewTransactionResponse {
    /**
     * Constructs a new NewTransactionResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.NewTransactionResponse.$Properties);

    /** Unknown fields preserved while decoding */
    $unknowns?: Uint8Array[];

    /** NewTransactionResponse payinAddress. */
    payinAddress: string;

    /** NewTransactionResponse payinExtraId. */
    payinExtraId: string;

    /** NewTransactionResponse refundAddress. */
    refundAddress: string;

    /** NewTransactionResponse refundExtraId. */
    refundExtraId: string;

    /** NewTransactionResponse payoutAddress. */
    payoutAddress: string;

    /** NewTransactionResponse payoutExtraId. */
    payoutExtraId: string;

    /** NewTransactionResponse currencyFrom. */
    currencyFrom: string;

    /** NewTransactionResponse currencyTo. */
    currencyTo: string;

    /** NewTransactionResponse amountToProvider. */
    amountToProvider: Uint8Array;

    /** NewTransactionResponse amountToWallet. */
    amountToWallet: Uint8Array;

    /** NewTransactionResponse deviceTransactionId. */
    deviceTransactionId: string;

    /** NewTransactionResponse deviceTransactionIdNg. */
    deviceTransactionIdNg: Uint8Array;

    /**
     * Creates a new NewTransactionResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewTransactionResponse instance
     */
    static create(
      properties: ledger_trade.NewTransactionResponse.$Shape,
    ): ledger_trade.NewTransactionResponse & ledger_trade.NewTransactionResponse.$Shape;
    static create(
      properties?: ledger_trade.NewTransactionResponse.$Properties,
    ): ledger_trade.NewTransactionResponse;

    /**
     * Encodes the specified NewTransactionResponse message. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @param message NewTransactionResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(
      message: ledger_trade.NewTransactionResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewTransactionResponse message, length delimited. Does not implicitly {@link ledger_trade.NewTransactionResponse.verify|verify} messages.
     * @param message NewTransactionResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encodeDelimited(
      message: ledger_trade.NewTransactionResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ledger_trade.NewTransactionResponse & ledger_trade.NewTransactionResponse.$Shape} NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewTransactionResponse & ledger_trade.NewTransactionResponse.$Shape;

    /**
     * Decodes a NewTransactionResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns {ledger_trade.NewTransactionResponse & ledger_trade.NewTransactionResponse.$Shape} NewTransactionResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewTransactionResponse & ledger_trade.NewTransactionResponse.$Shape;

    /**
     * Verifies a NewTransactionResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewTransactionResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewTransactionResponse
     */
    static fromObject(object: { [k: string]: any }): ledger_trade.NewTransactionResponse;

    /**
     * Creates a plain object from a NewTransactionResponse message. Also converts values to other types if specified.
     * @param message NewTransactionResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    static toObject(
      message: ledger_trade.NewTransactionResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewTransactionResponse to JSON.
     * @returns JSON object
     */
    toJSON(): { [k: string]: any };

    /**
     * Gets the type url for NewTransactionResponse
     * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
     * @returns The type url
     */
    static getTypeUrl(prefix?: string): string;
  }

  namespace NewTransactionResponse {
    /** Properties of a NewTransactionResponse. */
    interface $Properties {
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

      /** Unknown fields preserved while decoding */
      $unknowns?: Uint8Array[];
    }

    /** Shape of a NewTransactionResponse. */
    type $Shape = ledger_trade.NewTransactionResponse.$Properties;
  }

  /**
   * Properties of a UDecimal.
   * @deprecated Use ledger_trade.UDecimal.$Properties instead.
   */
  interface IUDecimal extends ledger_trade.UDecimal.$Properties {}

  /** Represents a UDecimal. */
  class UDecimal {
    /**
     * Constructs a new UDecimal.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.UDecimal.$Properties);

    /** Unknown fields preserved while decoding */
    $unknowns?: Uint8Array[];

    /** UDecimal coefficient. */
    coefficient: Uint8Array;

    /** UDecimal exponent. */
    exponent: number;

    /**
     * Creates a new UDecimal instance using the specified properties.
     * @param [properties] Properties to set
     * @returns UDecimal instance
     */
    static create(
      properties: ledger_trade.UDecimal.$Shape,
    ): ledger_trade.UDecimal & ledger_trade.UDecimal.$Shape;
    static create(properties?: ledger_trade.UDecimal.$Properties): ledger_trade.UDecimal;

    /**
     * Encodes the specified UDecimal message. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @param message UDecimal message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(
      message: ledger_trade.UDecimal.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified UDecimal message, length delimited. Does not implicitly {@link ledger_trade.UDecimal.verify|verify} messages.
     * @param message UDecimal message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encodeDelimited(
      message: ledger_trade.UDecimal.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a UDecimal message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ledger_trade.UDecimal & ledger_trade.UDecimal.$Shape} UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.UDecimal & ledger_trade.UDecimal.$Shape;

    /**
     * Decodes a UDecimal message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns {ledger_trade.UDecimal & ledger_trade.UDecimal.$Shape} UDecimal
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.UDecimal & ledger_trade.UDecimal.$Shape;

    /**
     * Verifies a UDecimal message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a UDecimal message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UDecimal
     */
    static fromObject(object: { [k: string]: any }): ledger_trade.UDecimal;

    /**
     * Creates a plain object from a UDecimal message. Also converts values to other types if specified.
     * @param message UDecimal
     * @param [options] Conversion options
     * @returns Plain object
     */
    static toObject(
      message: ledger_trade.UDecimal,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this UDecimal to JSON.
     * @returns JSON object
     */
    toJSON(): { [k: string]: any };

    /**
     * Gets the type url for UDecimal
     * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
     * @returns The type url
     */
    static getTypeUrl(prefix?: string): string;
  }

  namespace UDecimal {
    /** Properties of a UDecimal. */
    interface $Properties {
      /** UDecimal coefficient */
      coefficient?: Uint8Array | null;

      /** UDecimal exponent */
      exponent?: number | null;

      /** Unknown fields preserved while decoding */
      $unknowns?: Uint8Array[];
    }

    /** Shape of a UDecimal. */
    type $Shape = ledger_trade.UDecimal.$Properties;
  }

  /**
   * Properties of a NewSellResponse.
   * @deprecated Use ledger_trade.NewSellResponse.$Properties instead.
   */
  interface INewSellResponse extends ledger_trade.NewSellResponse.$Properties {}

  /** Represents a NewSellResponse. */
  class NewSellResponse {
    /**
     * Constructs a new NewSellResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.NewSellResponse.$Properties);

    /** Unknown fields preserved while decoding */
    $unknowns?: Uint8Array[];

    /** NewSellResponse traderEmail. */
    traderEmail: string;

    /** NewSellResponse inCurrency. */
    inCurrency: string;

    /** NewSellResponse inAmount. */
    inAmount: Uint8Array;

    /** NewSellResponse inAddress. */
    inAddress: string;

    /** NewSellResponse outCurrency. */
    outCurrency: string;

    /** NewSellResponse outAmount. */
    outAmount?: ledger_trade.UDecimal.$Properties | null;

    /** NewSellResponse deviceTransactionId. */
    deviceTransactionId: Uint8Array;

    /** NewSellResponse inExtraId. */
    inExtraId: string;

    /**
     * Creates a new NewSellResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewSellResponse instance
     */
    static create(
      properties: ledger_trade.NewSellResponse.$Shape,
    ): ledger_trade.NewSellResponse & ledger_trade.NewSellResponse.$Shape;
    static create(
      properties?: ledger_trade.NewSellResponse.$Properties,
    ): ledger_trade.NewSellResponse;

    /**
     * Encodes the specified NewSellResponse message. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @param message NewSellResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(
      message: ledger_trade.NewSellResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewSellResponse message, length delimited. Does not implicitly {@link ledger_trade.NewSellResponse.verify|verify} messages.
     * @param message NewSellResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encodeDelimited(
      message: ledger_trade.NewSellResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ledger_trade.NewSellResponse & ledger_trade.NewSellResponse.$Shape} NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewSellResponse & ledger_trade.NewSellResponse.$Shape;

    /**
     * Decodes a NewSellResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns {ledger_trade.NewSellResponse & ledger_trade.NewSellResponse.$Shape} NewSellResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewSellResponse & ledger_trade.NewSellResponse.$Shape;

    /**
     * Verifies a NewSellResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewSellResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewSellResponse
     */
    static fromObject(object: { [k: string]: any }): ledger_trade.NewSellResponse;

    /**
     * Creates a plain object from a NewSellResponse message. Also converts values to other types if specified.
     * @param message NewSellResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    static toObject(
      message: ledger_trade.NewSellResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewSellResponse to JSON.
     * @returns JSON object
     */
    toJSON(): { [k: string]: any };

    /**
     * Gets the type url for NewSellResponse
     * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
     * @returns The type url
     */
    static getTypeUrl(prefix?: string): string;
  }

  namespace NewSellResponse {
    /** Properties of a NewSellResponse. */
    interface $Properties {
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
      outAmount?: ledger_trade.UDecimal.$Properties | null;

      /** NewSellResponse deviceTransactionId */
      deviceTransactionId?: Uint8Array | null;

      /** NewSellResponse inExtraId */
      inExtraId?: string | null;

      /** Unknown fields preserved while decoding */
      $unknowns?: Uint8Array[];
    }

    /** Shape of a NewSellResponse. */
    type $Shape = ledger_trade.NewSellResponse.$Properties;
  }

  /**
   * Properties of a NewFundResponse.
   * @deprecated Use ledger_trade.NewFundResponse.$Properties instead.
   */
  interface INewFundResponse extends ledger_trade.NewFundResponse.$Properties {}

  /** Represents a NewFundResponse. */
  class NewFundResponse {
    /**
     * Constructs a new NewFundResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: ledger_trade.NewFundResponse.$Properties);

    /** Unknown fields preserved while decoding */
    $unknowns?: Uint8Array[];

    /** NewFundResponse userId. */
    userId: string;

    /** NewFundResponse accountName. */
    accountName: string;

    /** NewFundResponse inCurrency. */
    inCurrency: string;

    /** NewFundResponse inAmount. */
    inAmount: Uint8Array;

    /** NewFundResponse inAddress. */
    inAddress: string;

    /** NewFundResponse deviceTransactionId. */
    deviceTransactionId: Uint8Array;

    /** NewFundResponse inExtraId. */
    inExtraId: string;

    /**
     * Creates a new NewFundResponse instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NewFundResponse instance
     */
    static create(
      properties: ledger_trade.NewFundResponse.$Shape,
    ): ledger_trade.NewFundResponse & ledger_trade.NewFundResponse.$Shape;
    static create(
      properties?: ledger_trade.NewFundResponse.$Properties,
    ): ledger_trade.NewFundResponse;

    /**
     * Encodes the specified NewFundResponse message. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @param message NewFundResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(
      message: ledger_trade.NewFundResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NewFundResponse message, length delimited. Does not implicitly {@link ledger_trade.NewFundResponse.verify|verify} messages.
     * @param message NewFundResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encodeDelimited(
      message: ledger_trade.NewFundResponse.$Properties,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ledger_trade.NewFundResponse & ledger_trade.NewFundResponse.$Shape} NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): ledger_trade.NewFundResponse & ledger_trade.NewFundResponse.$Shape;

    /**
     * Decodes a NewFundResponse message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns {ledger_trade.NewFundResponse & ledger_trade.NewFundResponse.$Shape} NewFundResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): ledger_trade.NewFundResponse & ledger_trade.NewFundResponse.$Shape;

    /**
     * Verifies a NewFundResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a NewFundResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NewFundResponse
     */
    static fromObject(object: { [k: string]: any }): ledger_trade.NewFundResponse;

    /**
     * Creates a plain object from a NewFundResponse message. Also converts values to other types if specified.
     * @param message NewFundResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    static toObject(
      message: ledger_trade.NewFundResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this NewFundResponse to JSON.
     * @returns JSON object
     */
    toJSON(): { [k: string]: any };

    /**
     * Gets the type url for NewFundResponse
     * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
     * @returns The type url
     */
    static getTypeUrl(prefix?: string): string;
  }

  namespace NewFundResponse {
    /** Properties of a NewFundResponse. */
    interface $Properties {
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

      /** Unknown fields preserved while decoding */
      $unknowns?: Uint8Array[];
    }

    /** Shape of a NewFundResponse. */
    type $Shape = ledger_trade.NewFundResponse.$Properties;
  }
}
