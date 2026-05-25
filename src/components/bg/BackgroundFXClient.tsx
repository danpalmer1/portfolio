import { lazy, Suspense, useEffect, useState } from "react";
import { canRunWebGL } from "../../lib/capability";

const WebGLBackground = lazy(() => import("./WebGLBackground"));

export default function BackgroundFXClient() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canRunWebGL());
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <WebGLBackground />
    </Suspense>
  );
}
