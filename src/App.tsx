import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Course from "./pages/Course";
import Lesson from "./pages/Lesson";
import Forums from "./pages/Forums";
import Leaderboard from "./pages/Leaderboard";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/TeacherDashboard";
import VirtualClassroom from "./pages/VirtualClassroom";
import StudyGroups from "./components/StudyGroups";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="/course/:id" element={
              <ProtectedRoute>
                <Course />
              </ProtectedRoute>
            } />
            <Route path="/lesson/:id" element={
              <ProtectedRoute>
                <Lesson />
              </ProtectedRoute>
            } />
            <Route path="/forums" element={
              <ProtectedRoute>
                <Forums />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/teacher-dashboard" element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/virtual-classroom" element={
              <ProtectedRoute>
                <VirtualClassroom />
              </ProtectedRoute>
            } />
            <Route path="/study-groups" element={
              <ProtectedRoute>
                <StudyGroups />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
