import { ReactNode } from 'react';

interface MenuScreenProps {
  isActive: boolean;
  children: ReactNode;
}

export default function MenuScreen({ isActive, children }: MenuScreenProps) {
  if (!isActive) return null;
  return <div id="menu-workspace" className="flex-1 flex flex-col overflow-hidden p-6 animate-fade-in">{children}</div>;
}
