import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ProfileIconProps {
  size?: number;
  color?: string;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({ size = 24, color = '#212529' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.8445 21.6619C8.15273 21.6619 5 21.0874 5 18.7866C5 16.4859 8.13273 14.3619 11.8445 14.3619C15.5364 14.3619 18.6891 16.4653 18.6891 18.766C18.6891 21.0659 15.5564 21.6619 11.8445 21.6619Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.8373 11.1736C14.26 11.1736 16.2237 9.21 16.2237 6.78727C16.2237 4.36455 14.26 2.4 11.8373 2.4C9.41458 2.4 7.45004 4.36455 7.45004 6.78727C7.44186 9.20182 9.39186 11.1655 11.8064 11.1736C11.8173 11.1736 11.8273 11.1736 11.8373 11.1736Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
