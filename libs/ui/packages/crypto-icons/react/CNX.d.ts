/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CNX({ size, color }: Props): JSX.Element;
declare namespace CNX {
    var DefaultColor: string;
}
export default CNX;
