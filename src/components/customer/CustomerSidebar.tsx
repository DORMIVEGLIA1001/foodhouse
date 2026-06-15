import { ReactNode } from 'react';

interface CustomerSidebarProps {
  children: ReactNode;
}

export default function CustomerSidebar({ children }: CustomerSidebarProps) {
  return <>{children}</>;
}
