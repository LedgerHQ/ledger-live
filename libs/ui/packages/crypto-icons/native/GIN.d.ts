/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GIN({ size, color }: Props): JSX.Element;
declare namespace GIN {
    var DefaultColor: string;
}
export default GIN;
