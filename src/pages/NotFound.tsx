import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
    <img src="/Lexi.Nutural.png" alt="" className="h-28 w-28 object-contain" />
    <h1 className="text-3xl font-bold text-foreground">We couldn't find that page</h1>
    <p className="max-w-sm text-muted-foreground">The link may be out of date, or the page may have moved.</p>
    <Button asChild>
      <Link to="/">Back to LexiTrack</Link>
    </Button>
  </main>
);

export default NotFound;
