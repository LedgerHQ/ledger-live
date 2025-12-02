/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function USDA({ size, color }: Props): JSX.Element;
declare namespace USDA {
    var DefaultColor: string;
}
export default USDA;
