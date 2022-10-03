/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TNB({ size, color }: Props): JSX.Element;
declare namespace TNB {
    var DefaultColor: string;
}
export default TNB;
