import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { motion } from "framer-motion";
import { BookOpen, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setStudentSession } from "@/hooks/useStudentSession";

interface ClassOption {
  id: string;
  name: string;
  grade: string;
}

interface StudentOption {
  id: string;
  username: string;
  student_password: string;
  name: string;
  avatar: string;
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const { teacherCode } = useParams<{ teacherCode: string }>();
  const teacherId = teacherCode ?? "";

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Load classes on mount — scoped to this teacher
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      const { data, error } = await (supabase as any).rpc("get_classes_for_login", {
        teacher_id_input: teacherId || null,
      });
      if (!error && data) setClasses(data as ClassOption[]);
      setLoadingClasses(false);
    };
    fetchClasses();
  }, [teacherId]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setSelectedStudentId("");
      setPassword("");
      setError("");
      const { data, error } = await (supabase as any).rpc("get_students_for_login", {
        class_id_input: selectedClassId,
      });
      if (!error && data) setStudents(data as StudentOption[]);
      setLoadingStudents(false);
    };
    fetchStudents();
  }, [selectedClassId]);

  const handleLogin = async () => {
    setError("");
    if (!selectedStudentId || !password) {
      setError("Please select your name and enter your password.");
      return;
    }
    setLoggingIn(true);
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setError("Student not found.");
      setLoggingIn(false);
      return;
    }
    if (student.student_password !== password) {
      setError("Wrong password. Ask your teacher for help! 🙋");
      setLoggingIn(false);
      return;
    }
    setStudentSession({
      studentId: student.id,
      studentName: student.name,
      username: student.username,
      classId: selectedClassId,
      avatar: student.avatar,
    });
    navigate(`/student/${teacherId}/portal`);
    setLoggingIn(false);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img src={lexitrackLogo} alt="LexiTrack" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-display font-extrabold text-foreground">Student Login</h1>
          <p className="text-muted-foreground mt-2">Pick your name and enter your password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated space-y-5">
          {/* Class selector */}
          <div>
            <Label className="text-base font-semibold">Your Class</Label>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              disabled={loadingClasses}
            >
              <SelectTrigger className="mt-1.5 h-12 text-base">
                <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select your class"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student selector */}
          {selectedClassId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Label className="text-base font-semibold">Your Name</Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={loadingStudents}
              >
                <SelectTrigger className="mt-1.5 h-12 text-base">
                  <SelectValue
                    placeholder={
                      loadingStudents
                        ? "Loading students..."
                        : students.length === 0
                        ? "No students with logins yet"
                        : "Choose your name"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.avatar} {s.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Password + avatar preview */}
          {selectedStudentId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {selectedStudent && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <span className="text-3xl">{selectedStudent.avatar}</span>
                  <p className="font-bold text-foreground">@{selectedStudent.username}</p>
                </div>
              )}
              <div>
                <Label className="text-base font-semibold">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your password"
                  className="mt-1.5 h-12 text-base"
                />
              </div>
            </motion.div>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedStudentId || !password || loggingIn}
            className="w-full h-12 text-base gap-2"
          >
            {loggingIn ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Let's Read! 📚</>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your teacher will give you your username and password.
        </p>
      </motion.div>
    </div>
  );
};

export default StudentLogin;
