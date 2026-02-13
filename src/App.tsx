import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { DownloadAppPopup } from "@/components/DownloadAppPopup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AiTutor from "./pages/AiTutor";
import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";
import QuizCreate from "./pages/QuizCreate";
import Classes from "./pages/Classes";
import Materials from "./pages/Materials";
import Notes from "./pages/Notes";
import Forums from "./pages/Forums";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DownloadAppPopup />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute><AppLayout><Materials /></AppLayout></ProtectedRoute>} />
            <Route path="/ai-tutor" element={<ProtectedRoute><AppLayout><AiTutor /></AppLayout></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><AppLayout><Quizzes /></AppLayout></ProtectedRoute>} />
            <Route path="/quizzes/create" element={<ProtectedRoute><AppLayout><QuizCreate /></AppLayout></ProtectedRoute>} />
            <Route path="/quizzes/:id" element={<ProtectedRoute><AppLayout><QuizDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><AppLayout><Classes /></AppLayout></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><AppLayout><Notes /></AppLayout></ProtectedRoute>} />
            <Route path="/forums" element={<ProtectedRoute><AppLayout><Forums /></AppLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
