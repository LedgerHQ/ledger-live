/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function GLINT({ size, color }: Props): JSX.Element;
declare namespace GLINT {
    var DefaultColor: string;
}
export default GLINT;
