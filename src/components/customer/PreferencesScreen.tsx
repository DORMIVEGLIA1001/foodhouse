import { ReactNode } from 'react';

interface PreferencesScreenProps {
  isActive: boolean;
  children: ReactNode;
}

export default function PreferencesScreen({ isActive, children }: PreferencesScreenProps) {
  if (!isActive) return null;
  return <div id="preferences-workspace" className="flex-1 flex flex-col p-6 overflow-hidden">{children}</div>;
}
