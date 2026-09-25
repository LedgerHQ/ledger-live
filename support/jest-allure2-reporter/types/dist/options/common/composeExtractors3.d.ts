import type { PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function composeExtractors3<Context, V, Rc, Rb = Rc, Ra = V>(a: PropertyExtractor<Context, Rb, Ra>, b: PropertyExtractor<Context, Rc, Rb>, c: PropertyExtractor<Context, V, Rc>): PropertyExtractor<Context, V, Ra>;
