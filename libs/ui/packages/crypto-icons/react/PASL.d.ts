/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function PASL({ size, color }: Props): JSX.Element;
declare namespace PASL {
    var DefaultColor: string;
}
export default PASL;
