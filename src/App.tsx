import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemoProvider } from "@/hooks/useDemo";
import ProtectedRoute from "@/components/ProtectedRoute";

import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HomeWaitlist from "./pages/HomeWaitlist";
import Success from "./pages/Success";

// Lazy-load heavy routes to keep landing page fast
const StudentDetail = lazy(() => import("./pages/StudentDetail"));
const ClusterView = lazy(() => import("./pages/ClusterView"));
const ParentReport = lazy(() => import("./pages/ParentReport"));
const ManageClass = lazy(() => import("./pages/ManageClass"));
const AssessmentsLibrary = lazy(() => import("./pages/AssessmentsLibrary"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const PublicParentReport = lazy(() => import("./pages/PublicParentReport"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const Terms = lazy(() => import("./pages/Terms"));
const Ethics = lazy(() => import("./pages/Ethics"));
const Sandbox = lazy(() => import("./pages/Sandbox"));

const queryClient = new QueryClient();



const SuspenseFallback = () => <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <DemoProvider>
        <Toaster />
        <Sonner />
        
        <BrowserRouter>
          <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/ethics" element={<Ethics />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/home-waitlist" element={<HomeWaitlist />} />
            <Route path="/success" element={<Success />} />
            <Route path="/student/:teacherCode" element={<StudentLogin />} />
            <Route path="/student/:teacherCode/portal" element={<StudentPortal />} />
            <Route path="/parent/:teacherCode/:studentId" element={<PublicParentReport />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
            <Route path="/clusters" element={<ProtectedRoute><ClusterView /></ProtectedRoute>} />
            <Route path="/parent-report" element={<ProtectedRoute><ParentReport /></ProtectedRoute>} />
            <Route path="/manage-class" element={<ProtectedRoute><ManageClass /></ProtectedRoute>} />
            <Route path="/assessments" element={<ProtectedRoute><AssessmentsLibrary /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </DemoProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
