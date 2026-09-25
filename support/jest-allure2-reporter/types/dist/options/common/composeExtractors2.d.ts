import type { MaybeNullish, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function composeExtractors2<Context, Value, Result>(a: undefined | null, b: PropertyExtractor<Context, Value, Result>): typeof b;
export declare function composeExtractors2<Context, Value, Ra, Rb>(a: PropertyExtractor<Context, Rb, Ra>, b: PropertyExtractor<Context, Value, Rb>): PropertyExtractor<Context, Value, Ra>;
export declare function composeExtractors2<Context, Value, Ra, Rb>(a: MaybeNullish<PropertyExtractor<Context, Rb, Ra>>, b: PropertyExtractor<Context, Value, Rb>): PropertyExtractor<Context, Value, Ra | Rb>;
