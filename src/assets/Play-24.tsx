// Generated code, do not edit manually. Run the following command to regenerate it:
// > nx generate-icons packages/shared/render

import {SVGProps, ReactElement, createElement} from 'react';
import type {IconProps} from '@packages/utilities/icon-support';
export default /*#__PURE__#*/ function Play24(
  props: IconProps
): ReactElement<SVGProps<SVGElement>> {
  const inputScale = props.scale ?? 1;
  const scale =
    typeof inputScale === 'number' ? inputScale : parseInt(inputScale, 10);
  return createElement(
    'svg',
    {
      'data-icon': 'Play24',
      'aria-hidden': true,
      focusable: false,
      width: 44 * scale,
      height: 44 * scale,
      viewBox: '0 0 44 44',
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
    createElement('circle', {fill: '#2e2e2e', cx: '22', cy: '22', r: '22'}),
    createElement(
      'g',
      {transform: 'translate(6,3) scale(1.57)'},
      createElement('path', {
        d: 'M4 19.2902V4.70985C4 3.94502 4.82366 3.46331 5.49026 3.83827L18.4505 11.1284C19.1302 11.5107 19.1302 12.4893 18.4505 12.8716L5.49026 20.1617C4.82366 20.5367 4 20.055 4 19.2902Z',
        fill: 'white',
      })
    )
  );
}
