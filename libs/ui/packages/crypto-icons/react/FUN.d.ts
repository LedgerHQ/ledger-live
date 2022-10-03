/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FUN({ size, color }: Props): JSX.Element;
declare namespace FUN {
    var DefaultColor: string;
}
export default FUN;
