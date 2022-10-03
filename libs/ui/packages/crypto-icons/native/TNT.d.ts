/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TNT({ size, color }: Props): JSX.Element;
declare namespace TNT {
    var DefaultColor: string;
}
export default TNT;
