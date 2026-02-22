import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import Battle from "./pages/Battle";
import Labs from "./pages/Labs";
import Quizzes from "./pages/Quizzes";
import Career from "./pages/Career";
import Gadgets from "./pages/Gadgets";
import Meetings from "./pages/Meetings";
import InstructorApply from "./pages/InstructorApply";
import NotFound from "./pages/NotFound";
import AdminUsers from "./pages/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/career" element={<Career />} />
          <Route path="/gadgets" element={<Gadgets />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/instructor-apply" element={<InstructorApply />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
