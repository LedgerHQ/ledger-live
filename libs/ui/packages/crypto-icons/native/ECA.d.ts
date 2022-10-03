/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ECA({ size, color }: Props): JSX.Element;
declare namespace ECA {
    var DefaultColor: string;
}
export default ECA;
