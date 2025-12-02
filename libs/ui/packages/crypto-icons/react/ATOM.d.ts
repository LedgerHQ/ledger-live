/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function ATOM({ size, color }: Props): JSX.Element;
declare namespace ATOM {
    var DefaultColor: string;
}
export default ATOM;
