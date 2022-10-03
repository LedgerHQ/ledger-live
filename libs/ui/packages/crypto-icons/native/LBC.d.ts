/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LBC({ size, color }: Props): JSX.Element;
declare namespace LBC {
    var DefaultColor: string;
}
export default LBC;
