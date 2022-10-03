/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XLM({ size, color }: Props): JSX.Element;
declare namespace XLM {
    var DefaultColor: string;
}
export default XLM;
