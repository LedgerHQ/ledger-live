/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AEON({ size, color }: Props): JSX.Element;
declare namespace AEON {
    var DefaultColor: string;
}
export default AEON;
