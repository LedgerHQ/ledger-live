/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CS({ size, color }: Props): JSX.Element;
declare namespace CS {
    var DefaultColor: string;
}
export default CS;
