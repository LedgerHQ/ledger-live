/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FIL({ size, color }: Props): JSX.Element;
declare namespace FIL {
    var DefaultColor: string;
}
export default FIL;
