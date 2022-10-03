/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FJC({ size, color }: Props): JSX.Element;
declare namespace FJC {
    var DefaultColor: string;
}
export default FJC;
