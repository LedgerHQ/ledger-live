/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SYS({ size, color }: Props): JSX.Element;
declare namespace SYS {
    var DefaultColor: string;
}
export default SYS;
