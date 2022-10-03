/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PRL({ size, color }: Props): JSX.Element;
declare namespace PRL {
    var DefaultColor: string;
}
export default PRL;
