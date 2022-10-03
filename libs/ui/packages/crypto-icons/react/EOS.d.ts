/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EOS({ size, color }: Props): JSX.Element;
declare namespace EOS {
    var DefaultColor: string;
}
export default EOS;
