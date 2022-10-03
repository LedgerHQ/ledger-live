/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ZEST({ size, color }: Props): JSX.Element;
declare namespace ZEST {
    var DefaultColor: string;
}
export default ZEST;
