/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ETP({ size, color }: Props): JSX.Element;
declare namespace ETP {
    var DefaultColor: string;
}
export default ETP;
