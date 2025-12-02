/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function NEON({ size, color }: Props): JSX.Element;
declare namespace NEON {
    var DefaultColor: string;
}
export default NEON;
