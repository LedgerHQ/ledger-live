/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function CLAM({ size, color }: Props): JSX.Element;
declare namespace CLAM {
    var DefaultColor: string;
}
export default CLAM;
