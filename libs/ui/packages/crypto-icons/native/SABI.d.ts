/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SABI({ size, color }: Props): JSX.Element;
declare namespace SABI {
    var DefaultColor: string;
}
export default SABI;
