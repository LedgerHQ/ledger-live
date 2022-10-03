/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DRGN({ size, color }: Props): JSX.Element;
declare namespace DRGN {
    var DefaultColor: string;
}
export default DRGN;
