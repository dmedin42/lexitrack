import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InviteCaregiverDialogProps {
  studentId: string;
  studentName: string;
}

const InviteCaregiverDialog = ({ studentId, studentName }: InviteCaregiverDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleCopy = () => {
    const url = `${window.location.origin}/parent/${user?.id ?? ""}/${studentId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? "Link Copied!" : "Share Parent Report"}
    </Button>
  );
};

export default InviteCaregiverDialog;
