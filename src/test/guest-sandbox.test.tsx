import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const authState = vi.hoisted(() => ({
  current: { user: null as null | { id: string; is_anonymous?: boolean }, loading: false },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ ...authState.current, role: "teacher", session: null, signOut: vi.fn() }),
}));
vi.mock("@/hooks/useDemo", () => ({
  useDemo: () => ({ isDemo: false, enableDemo: vi.fn(), disableDemo: vi.fn() }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: vi.fn(), signInAnonymously: vi.fn() } },
}));

import ProtectedRoute from "@/components/ProtectedRoute";

function renderAt(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<p>Sign-in page</p>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>Teacher dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute and Sandbox Mode", () => {
  beforeEach(() => {
    authState.current = { user: null, loading: false };
  });

  it("sends signed-out visitors to the sign-in page", () => {
    renderAt();
    expect(screen.getByText("Sign-in page")).toBeInTheDocument();
  });

  it("shows the sandbox banner to guest teachers", () => {
    authState.current = { user: { id: "guest-1", is_anonymous: true }, loading: false };
    renderAt();
    expect(screen.getByText("Teacher dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Sandbox Mode as a guest teacher/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a free account" })).toBeInTheDocument();
  });

  it("does not show the banner to regular teachers", () => {
    authState.current = { user: { id: "teacher-1", is_anonymous: false }, loading: false };
    renderAt();
    expect(screen.getByText("Teacher dashboard")).toBeInTheDocument();
    expect(screen.queryByText(/Sandbox Mode as a guest teacher/)).not.toBeInTheDocument();
  });
});
