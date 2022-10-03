/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STQ({ size, color }: Props): JSX.Element;
declare namespace STQ {
    var DefaultColor: string;
}
export default STQ;
