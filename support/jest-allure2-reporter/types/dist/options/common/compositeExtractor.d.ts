import type { PromisedProperties, PropertyExtractor } from '@support/jest-allure2-reporter';
import type { CompositeExtractorLoose } from '../types';
export declare function compositeExtractor<Context, Shape>(looseCustomizer: CompositeExtractorLoose<Context, Shape>): PropertyExtractor<Context, PromisedProperties<Shape>, PromisedProperties<Shape>>;
