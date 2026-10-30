import { createContext, useContext, useState, ReactNode } from "react";

interface DemoContextType {
  isDemo: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  enableDemo: () => {},
  disableDemo: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => {
    try { return sessionStorage.getItem("lexitrack-demo") === "true"; } catch { return false; }
  });

  const enableDemo = () => {
    setIsDemo(true);
    try { sessionStorage.setItem("lexitrack-demo", "true"); } catch {}
  };

  const disableDemo = () => {
    setIsDemo(false);
    try { sessionStorage.removeItem("lexitrack-demo"); } catch {}
  };

  return (
    <DemoContext.Provider value={{ isDemo, enableDemo, disableDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
