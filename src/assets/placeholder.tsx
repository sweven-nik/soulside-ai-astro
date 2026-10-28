// Generated code, do not edit manually. Run the following command to regenerate it:
// > nx generate-icons packages/shared/render

import {SVGProps, ReactElement, createElement} from 'react';
import type {IconProps} from '@packages/utilities/icon-support';
export default /*#__PURE__#*/ function Placeholder(
  props: IconProps
): ReactElement<SVGProps<SVGElement>> {
  const inputScale = props.scale ?? 1;
  const scale =
    typeof inputScale === 'number' ? inputScale : parseInt(inputScale, 10);
  return createElement(
    'svg',
    {
      'data-icon': 'Placeholder',
      'aria-hidden': true,
      focusable: false,
      width: 140 * scale,
      height: 140 * scale,
      viewBox: '0 0 140 140',
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
    createElement('path', {fill: '#E0E0E0', d: 'M0 0h140v140H0z'}),
    createElement('path', {
      d: 'M92 88H48c-1.1 0-2-.9-2-2V54c0-1.1.9-2 2-2h44c1.1 0 2 .9 2 2v32c0 1.1-.9 2-2 2zM68.28 73.573l-3.415-3.521-9.635 10.947h30.12L74.565 64.644l-6.284 8.928zm-5.361-9.05a3.791 3.791 0 1 0-7.583.001 3.791 3.791 0 0 0 7.583 0z',
      fill: '#C2C2C2',
    })
  );
}
