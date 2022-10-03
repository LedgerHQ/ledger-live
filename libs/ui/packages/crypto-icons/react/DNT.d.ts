/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DNT({ size, color }: Props): JSX.Element;
declare namespace DNT {
    var DefaultColor: string;
}
export default DNT;
