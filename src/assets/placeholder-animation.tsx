// Generated code, do not edit manually. Run the following command to regenerate it:
// > nx generate-icons packages/shared/render

import {SVGProps, ReactElement, createElement} from 'react';
import type {IconProps} from '@packages/utilities/icon-support';
export default /*#__PURE__#*/ function PlaceholderAnimation(
  props: IconProps
): ReactElement<SVGProps<SVGElement>> {
  const inputScale = props.scale ?? 1;
  const scale =
    typeof inputScale === 'number' ? inputScale : parseInt(inputScale, 10);
  return createElement(
    'svg',
    {
      'data-icon': 'PlaceholderAnimation',
      'aria-hidden': true,
      focusable: false,
      width: 198 * scale,
      height: 84 * scale,
      viewBox: '0 0 198 84',
      y: props.y != null ? props.y : undefined,
      x: props.x != null ? props.x : undefined,
      className: 'bem-Svg' + (props.className ? ' ' + props.className : ''),
      style: {
        ...{
          display: 'block',
        },
        ...props.style,
      },
    },
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M0 4a4 4 0 0 1 4-4c14.154 0 27.213 10.423 36.484 24.935 5.002 7.831 9.082 17.103 11.8 27.18 1.664-5.056 3.772-9.699 6.255-13.789C65.087 27.541 74.677 20 86 20c11.323 0 20.913 7.541 27.461 18.326 2.878 4.74 5.252 10.221 7.013 16.23 1.066-2.765 2.305-5.347 3.698-7.704 2.179-3.688 4.822-6.948 7.854-9.467a35.888 35.888 0 0 0 1.698 9.653 33.112 33.112 0 0 0-2.665 3.884C126.777 58.168 124 68.44 124 80a4 4 0 0 1-8 0c0-14.855-3.664-28.111-9.378-37.522C100.865 32.995 93.455 28 86 28s-14.865 4.995-20.623 14.478C59.664 51.888 56 65.145 56 80a4 4 0 0 1-8 0c0-19.133-5.714-37.384-14.258-50.758C25.087 15.694 14.147 8 4 8a4 4 0 0 1-4-4zm138 32c0-16.569 13.431-30 30-30 16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30-16.569 0-30-13.431-30-30z',
      fill: '#C2C2C2',
    })
  );
}
