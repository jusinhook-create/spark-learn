import React from "react";

export default function RobotIcon({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="32" className="fill-current text-primary" />
      <rect x="31" y="20" width="2" height="6" fill="#fff" />
      <circle cx="32" cy="18" r="3" fill="#fff" />
      <rect x="16" y="24" width="32" height="20" rx="10" fill="#fff" />
      <path d="M44 44 L52 46 L44 46 Z" fill="#fff" />
      <circle cx="26" cy="34" r="2.5" className="fill-current text-primary" />
      <circle cx="38" cy="34" r="2.5" className="fill-current text-primary" />
    </svg>
  );
}
