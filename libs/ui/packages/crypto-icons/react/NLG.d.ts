/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function NLG({ size, color }: Props): JSX.Element;
declare namespace NLG {
    var DefaultColor: string;
}
export default NLG;
