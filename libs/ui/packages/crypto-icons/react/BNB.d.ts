/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BNB({ size, color }: Props): JSX.Element;
declare namespace BNB {
    var DefaultColor: string;
}
export default BNB;
