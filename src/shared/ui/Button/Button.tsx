import { type JSX, type ReactNode } from 'react';
import './button.css';

type Props = {
  text?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
  icon?: string;
  onClick?: () => void;
  type: 'button' | 'submit' | 'reset' | undefined;
  children?: ReactNode | JSX.Element;
};

export function Button({
  text,
  variant = 'primary',
  disabled,
  icon,
  onClick,
  type = 'button',
  children,
}: Props): JSX.Element {
  return (
    <button
      className={`button ${variant}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <img src={icon} width={20} alt="" />}
      {text}
      {children}
    </button>
  );
}