import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from '@/context/SessionContext';
import Layout from '@/components/Layout';
import SwipePage from '@/pages/SwipePage';
import SavedPage from '@/pages/SavedPage';
import ProfilePage from '@/pages/ProfilePage';
import MatchesPage from '@/pages/MatchesPage';
import AIPage from '@/pages/AIPage';
import ChatPage from '@/pages/ChatPage';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SwipePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:friendId" element={<ChatPage />} />
          <Route path="/social" element={<ChatPage />} />
          <Route path="/social/:friendId" element={<ChatPage />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}
