import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HeartIconProps {
  size?: number;
  color?: string;
}

export const HeartIcon: React.FC<HeartIconProps> = ({ size = 24, color = '#212529' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.9219 12.4463C1.8489 9.0963 3.1039 4.9313 6.6209 3.7993C8.4709 3.2023 10.7539 3.7003 12.0509 5.4893C13.2739 3.6343 15.6229 3.2063 17.4709 3.7993C20.9869 4.9313 22.2489 9.0963 21.1769 12.4463C19.5069 17.7563 13.6799 20.5223 12.0509 20.5223C10.4229 20.5223 4.6479 17.8183 2.9219 12.4463Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.7886 7.564C16.9956 7.688 17.7506 8.645 17.7056 9.986"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
