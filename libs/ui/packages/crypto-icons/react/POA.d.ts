/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POA({ size, color }: Props): JSX.Element;
declare namespace POA {
    var DefaultColor: string;
}
export default POA;
