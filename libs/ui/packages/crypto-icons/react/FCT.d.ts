/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FCT({ size, color }: Props): JSX.Element;
declare namespace FCT {
    var DefaultColor: string;
}
export default FCT;
