/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ELA({ size, color }: Props): JSX.Element;
declare namespace ELA {
    var DefaultColor: string;
}
export default ELA;
