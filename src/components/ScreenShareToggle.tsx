import { Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScreenShareToggleProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

const ScreenShareToggle = ({ enabled, onToggle }: ScreenShareToggleProps) => (
  <div className="flex items-center gap-2">
    <Monitor className={`w-4 h-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
    <Label htmlFor="screen-share-mode" className="text-sm text-muted-foreground cursor-pointer">
      Screen Share Mode
    </Label>
    <Switch id="screen-share-mode" checked={enabled} onCheckedChange={onToggle} />
  </div>
);

export default ScreenShareToggle;
