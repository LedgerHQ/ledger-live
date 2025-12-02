/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function CALL({ size, color }: Props): JSX.Element;
declare namespace CALL {
    var DefaultColor: string;
}
export default CALL;
