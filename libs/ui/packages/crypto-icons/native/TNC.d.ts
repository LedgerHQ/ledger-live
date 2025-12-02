/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function TNC({ size, color }: Props): JSX.Element;
declare namespace TNC {
    var DefaultColor: string;
}
export default TNC;
