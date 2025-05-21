
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading]);

  if (loading || !user) {
    return <div className="p-4">Loading...</div>;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  } else if (role === 'dispatcher') {
    return <DispatcherDashboard />;
  } else if (role === 'driver') {
    return <DriverDashboard />;
  } else {
    return <div className="p-4">Unknown role</div>;
  }
}

function AdminDashboard() {
  return <div className="p-4">Welcome, Admin! View and manage all orders.</div>;
}

function DispatcherDashboard() {
  return <div className="p-4">Welcome, Dispatcher! You can assign orders.</div>;
}

function DriverDashboard() {
  return <div className="p-4">Welcome, Driver! Here are your delivery tasks.</div>;
}
