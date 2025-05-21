
'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/lib/firebaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, 'users', userCred.user.uid), { role });
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          className="w-full p-2 border rounded" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="w-full p-2 border rounded" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded">
          <option value="admin">Admin</option>
          <option value="dispatcher">Dispatcher</option>
          <option value="driver">Driver</option>
        </select>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Sign Up</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}
