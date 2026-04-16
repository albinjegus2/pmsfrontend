'use client';

import { useAuth } from '../utils/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ActivityTracker from '../components/ActivityTracker';
import IdleWarningModal from '../components/IdleWarningModal';
import NotificationBell from '../components/NotificationBell';
import ParticleBackground from '../components/ParticleBackground';
import MouseLight from '../components/MouseLight';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="flex bg-transparent">
      <ParticleBackground count={120} />
      <MouseLight />
      <Sidebar />
      <ActivityTracker />
      <IdleWarningModal />
      <main className="ml-64 flex-1 min-h-screen bg-transparent dark:bg-transparent">
        <div className="flex justify-end px-6 pt-4">
          <NotificationBell />
        </div>
        <div className="px-6 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
