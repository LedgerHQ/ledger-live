/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function GENERIC({ size, color }: Props): JSX.Element;
declare namespace GENERIC {
    var DefaultColor: string;
}
export default GENERIC;
