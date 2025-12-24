import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ExploreIconProps {
  size?: number;
  color?: string;
}

export const ExploreIcon: React.FC<ExploreIconProps> = ({ size = 24, color = '#212529' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.75 12.0001C2.75 18.9371 5.063 21.2501 12 21.2501C18.937 21.2501 21.25 18.9371 21.25 12.0001C21.25 5.0631 18.937 2.7501 12 2.7501C5.063 2.7501 2.75 5.0631 2.75 12.0001Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.6978 15.3023L10.2718 10.2723L15.3018 8.6983L13.7278 13.7273L8.6978 15.3023Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
