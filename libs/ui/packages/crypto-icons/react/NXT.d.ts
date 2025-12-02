/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function NXT({ size, color }: Props): JSX.Element;
declare namespace NXT {
    var DefaultColor: string;
}
export default NXT;
