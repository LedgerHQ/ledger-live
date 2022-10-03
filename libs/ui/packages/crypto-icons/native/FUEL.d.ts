/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FUEL({ size, color }: Props): JSX.Element;
declare namespace FUEL {
    var DefaultColor: string;
}
export default FUEL;
