// Generated code, do not edit manually. Run the following command to regenerate it:
// > nx generate-icons packages/shared/render

import {SVGProps, ReactElement, createElement} from 'react';
import type {IconProps} from '@packages/utilities/icon-support';
export default /*#__PURE__#*/ function Pause24(
  props: IconProps
): ReactElement<SVGProps<SVGElement>> {
  const inputScale = props.scale ?? 1;
  const scale =
    typeof inputScale === 'number' ? inputScale : parseInt(inputScale, 10);
  return createElement(
    'svg',
    {
      'data-icon': 'Pause24',
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
    createElement('rect', {
      x: '11',
      y: '9.4',
      width: '7.8',
      height: '25.1',
      rx: '1',
      fill: 'white',
    }),
    createElement('rect', {
      x: '25.1',
      y: '9.4',
      width: '7.8',
      height: '25.1',
      rx: '1',
      fill: 'white',
    })
  );
}
