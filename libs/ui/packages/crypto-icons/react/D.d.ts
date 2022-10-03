/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function D({ size, color }: Props): JSX.Element;
declare namespace D {
    var DefaultColor: string;
}
export default D;
