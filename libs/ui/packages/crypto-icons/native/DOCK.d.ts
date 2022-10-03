/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DOCK({ size, color }: Props): JSX.Element;
declare namespace DOCK {
    var DefaultColor: string;
}
export default DOCK;
