/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function IOST({ size, color }: Props): JSX.Element;
declare namespace IOST {
    var DefaultColor: string;
}
export default IOST;
