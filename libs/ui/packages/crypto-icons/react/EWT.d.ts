/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function EWT({ size, color }: Props): JSX.Element;
declare namespace EWT {
    var DefaultColor: string;
}
export default EWT;
