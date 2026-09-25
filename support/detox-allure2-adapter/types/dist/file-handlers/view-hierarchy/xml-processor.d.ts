export declare class XmlBuilder {
    private readonly xml;
    private screenshot?;
    private activePointer?;
    private errorMessage?;
    private platform?;
    private stylesheet?;
    constructor(xml: string);
    withScreenshot(base64Screenshot?: string): this;
    withActivePointer(pointer: string | undefined): this;
    withErrorMessage(message: string | undefined): this;
    withPlatform(platform: 'ios' | 'android' | undefined): this;
    withStylesheet(stylesheet: string | null | undefined | boolean): this;
    toString(): string;
    private injectAttributes;
    private injectErrorMessage;
    private injectXslStylesheet;
    private getStylesheet;
}
