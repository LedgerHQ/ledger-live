/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OST({ size, color }: Props): JSX.Element;
declare namespace OST {
    var DefaultColor: string;
}
export default OST;
