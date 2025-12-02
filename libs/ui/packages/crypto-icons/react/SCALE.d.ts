/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SCALE({ size, color }: Props): JSX.Element;
declare namespace SCALE {
    var DefaultColor: string;
}
export default SCALE;
