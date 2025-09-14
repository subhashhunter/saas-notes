'use client'

import { useState, useEffect } from 'react';


interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  tenant: {
    id: number;
    slug: string;
    plan: 'FREE' | 'PRO';
  };
}

interface Note {
  id: number;
  title: string;
  content: string;
  tenantId: number;
  ownerId: number;
  createdAt: string;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteLimitMessage, setNoteLimitMessage] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchNotes();
    }
  }, [token, user]);

  const handleLogin = async (email: string) => {
    setError('');
    const password = 'password';
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err: any) {
      setError('Login failed. Check your credentials.');
    }
  };

  const fetchNotes = async () => {
    if (!token || !user) return;
    try {
        const response = await fetch('/api/notes', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            setNotes(data);
            if (user.tenant.plan === 'FREE' && data.length >= 3) {
                setNoteLimitMessage('Upgrade to Pro to create more notes!');
            } else {
                setNoteLimitMessage('');
            }
        }
    } catch (err) {
        console.error('Failed to fetch notes:', err);
    }
};


  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newNoteTitle) {
        setError('Note title is required.');
        return;
    }

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: newNoteTitle,
                content: newNoteContent,
            }),
        });

        // The only change is to remove the 'if (response.status === 403)' block
        // The fetchNotes call will now handle setting the message if a 403 occurred.
        if (response.ok) {
            await fetchNotes();
            setNewNoteTitle('');
            setNewNoteContent('');
        } else {
            throw new Error('Failed to create note');
        }
    } catch (err) {
        setError('Failed to create note.');
    }
};
  const handleDeleteNote = async (id: number) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        await fetchNotes();
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  const handleUpgrade = async () => {
    if (!user || user.role !== 'ADMIN') return;

    try {
      const response = await fetch(
        `/api/tenants/${user.tenant.slug}/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const updatedUser = {
          ...user,
          tenant: { ...user.tenant, plan: 'PRO' as const },
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setNoteLimitMessage('Tenant upgraded to PRO! You now have unlimited notes. 🎉');
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (err) {
      setError('Failed to upgrade tenant.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setNotes([]);
    setNoteLimitMessage('');
    setError('');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Login</h1>
        <div className="flex flex-col space-y-4 w-80">
          <button
            onClick={() => handleLogin('admin@acme.test')}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Login as Admin (Acme)
          </button>
          <button
            onClick={() => handleLogin('user@acme.test')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Login as User (Acme)
          </button>
          <button
            onClick={() => handleLogin('admin@globex.test')}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Login as Admin (Globex)
          </button>
          <button
            onClick={() => handleLogin('user@globex.test')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Login as User (Globex)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 md:mb-0">
            {user.tenant.slug} Notes
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-md text-gray-600">
              Logged in as: <strong className="text-gray-900">{user.email}</strong> ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        {user.role === 'ADMIN' && user.tenant.plan === 'FREE' && (
          <div className="mb-6 p-6 border border-yellow-200 rounded-xl bg-yellow-50 text-yellow-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
            <p className="mb-4">
              Your current plan is **Free**. Upgrade to Pro for unlimited notes.
            </p>
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition duration-300"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {user.tenant.plan === 'PRO' && (
          <div className="mb-6 p-6 border border-green-200 rounded-xl bg-green-50 text-green-800 shadow-sm">
            <p className="font-semibold">You are on the **PRO** plan. Enjoy unlimited notes! 🚀</p>
          </div>
        )}

        {noteLimitMessage && (
          <div className="p-4 mb-4 text-center bg-red-100 text-red-700 rounded-md">
            {noteLimitMessage}
          </div>
        )}
        {error && (
          <div className="p-4 mb-4 text-center bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-8 bg-white shadow-xl rounded-xl h-min">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create a new note</h2>
            <form onSubmit={handleCreateNote} className="space-y-6">
              <input
                type="text"
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <textarea
                placeholder="Note content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Create Note
              </button>
            </form>
          </div>

          
          <div className="p-8 bg-white shadow-xl rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Notes</h2>
            <ul className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes yet. Create one above! 📝</p>
              ) : (
                notes.map((note) => (
                  <li
                    key={note.id}
                    className="p-4 border border-gray-200 rounded-lg flex justify-between items-center transition-all hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{note.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">{note.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition duration-300"
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}