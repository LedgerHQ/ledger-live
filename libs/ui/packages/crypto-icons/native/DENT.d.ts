/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DENT({ size, color }: Props): JSX.Element;
declare namespace DENT {
    var DefaultColor: string;
}
export default DENT;
