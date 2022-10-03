/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VET({ size, color }: Props): JSX.Element;
declare namespace VET {
    var DefaultColor: string;
}
export default VET;
