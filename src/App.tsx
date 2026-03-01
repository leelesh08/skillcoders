import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Battle from "./pages/Battle";
import BattleDetail from "./pages/BattleDetail";
import Labs from "./pages/Labs";
import Quizzes from "./pages/Quizzes";
import Career from "./pages/Career";
import Gadgets from "./pages/Gadgets";
import Meetings from "./pages/Meetings";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";

// Lazy load auth pages (users only need one)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// Lazy load checkout flow (only needed when purchasing)
const Cart = lazy(() => import("./pages/Cart"));
const CheckoutStatus = lazy(() => import("./pages/CheckoutStatus"));
const MockCheckout = lazy(() => import("./pages/MockCheckout"));

// Lazy load admin pages (separate chunk for admin role)
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCourses = lazy(() => import("./pages/AdminCourses"));
const AdminAudits = lazy(() => import("./pages/AdminAudits"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBattles = lazy(() => import("./pages/AdminBattles"));
const AdminQuizzes = lazy(() => import("./pages/AdminQuizzes"));
const AdminInstructors = lazy(() => import("./pages/AdminInstructors"));

// Lazy load instructor apply (rarely used)
const InstructorApply = lazy(() => import("./pages/InstructorApply"));

// Loading fallback component
const LoadingFallback = () => <div className="flex items-center justify-center min-h-screen"><div className="text-lg font-semibold">Loading...</div></div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<LoadingFallback />}><Register /></Suspense>} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/cart" element={<Suspense fallback={<LoadingFallback />}><Cart /></Suspense>} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/battle/:id" element={<BattleDetail />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/career" element={<Career />} />
          <Route path="/gadgets" element={<Gadgets />} />
          <Route path="/checkout/status" element={<Suspense fallback={<LoadingFallback />}><CheckoutStatus /></Suspense>} />
          <Route path="/mock-checkout" element={<Suspense fallback={<LoadingFallback />}><MockCheckout /></Suspense>} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/instructor-apply" element={<Suspense fallback={<LoadingFallback />}><InstructorApply /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<LoadingFallback />}><AdminUsers /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/battles" element={<Suspense fallback={<LoadingFallback />}><AdminBattles /></Suspense>} />
          <Route path="/admin/quizzes" element={<Suspense fallback={<LoadingFallback />}><AdminQuizzes /></Suspense>} />
          <Route path="/admin/instructors" element={<Suspense fallback={<LoadingFallback />}><AdminInstructors /></Suspense>} />
          <Route path="/admin/courses" element={<Suspense fallback={<LoadingFallback />}><AdminCourses /></Suspense>} />
          <Route path="/admin/audits" element={<Suspense fallback={<LoadingFallback />}><AdminAudits /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
