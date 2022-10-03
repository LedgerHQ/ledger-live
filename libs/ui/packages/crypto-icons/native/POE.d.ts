/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POE({ size, color }: Props): JSX.Element;
declare namespace POE {
    var DefaultColor: string;
}
export default POE;
