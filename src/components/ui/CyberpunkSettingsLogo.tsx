import React from 'react';

export interface CyberpunkSettingsLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
  spinOnHover?: boolean;
}

/**
 * Cyberpunk Settings Logo from Figma node 137:2
 * An angular cyberpunk gear with a centered hexagonal cutout.
 */
export const CyberpunkSettingsLogo: React.FC<CyberpunkSettingsLogoProps> = ({
  size = 24,
  color,
  className = '',
  spinOnHover = false,
  style,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 249.38 249.38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-transform duration-300 ${
        spinOnHover ? 'group-hover:rotate-90' : ''
      } ${className}`}
      style={{
        color: color || undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      <g id="Group">
        {/* Outer Angular Gear */}
        <path
          id="Vector"
          d="M88.72 37.85L103.54 33.1L104.03 7.5H145.35L145.84 33.1L160.66 37.85L174.5 44.97L192.95 27.21L222.17 56.43L204.41 74.88L211.53 88.72L216.28 103.54L241.88 104.03V145.35L216.28 145.84L211.53 160.66L204.41 174.5L222.17 192.95L192.95 222.17L174.5 204.41L160.66 211.53L145.84 216.28L145.35 241.88H104.03L103.54 216.28L88.72 211.53L74.88 204.41L56.43 222.17L27.21 192.95L44.97 174.5L37.85 160.66L33.1 145.84L7.5 145.35V104.03L33.1 103.54L37.85 88.72L44.97 74.88L27.21 56.43L56.43 27.21L74.88 44.97L88.72 37.85Z"
          stroke={color || 'currentColor'}
          strokeWidth="15"
          strokeLinejoin="miter"
        />
        {/* Center Hexagonal Aperture */}
        <path
          id="Vector_2"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M173.19 96.69V152.69L124.69 180.69L76.19 152.69V96.69L124.69 68.69L173.19 96.69ZM157.6 105.69V143.69L124.69 162.69L91.78 143.69V105.69L124.69 86.69L157.6 105.69Z"
          fill={color || 'currentColor'}
        />
      </g>
    </svg>
  );
};

export default CyberpunkSettingsLogo;
