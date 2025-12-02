/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SCRT({ size, color }: Props): JSX.Element;
declare namespace SCRT {
    var DefaultColor: string;
}
export default SCRT;
