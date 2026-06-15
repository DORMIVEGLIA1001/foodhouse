import { ReactNode } from 'react';

interface MenuGridSectionProps {
  children: ReactNode;
}

export default function MenuGridSection({ children }: MenuGridSectionProps) {
  return <div className="flex-1 overflow-y-auto pb-6 pr-1 scrollbar-thin">{children}</div>;
}
