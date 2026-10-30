export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          accuracy_score: number
          created_at: string | null
          date: string
          duration_seconds: number | null
          fluency_score: number
          id: string
          passage_id: string | null
          passage_title: string | null
          student_id: string
        }
        Insert: {
          accuracy_score: number
          created_at?: string | null
          date?: string
          duration_seconds?: number | null
          fluency_score: number
          id?: string
          passage_id?: string | null
          passage_title?: string | null
          student_id: string
        }
        Update: {
          accuracy_score?: number
          created_at?: string | null
          date?: string
          duration_seconds?: number | null
          fluency_score?: number
          id?: string
          passage_id?: string | null
          passage_title?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_students: {
        Row: {
          caregiver_id: string
          student_id: string
        }
        Insert: {
          caregiver_id: string
          student_id: string
        }
        Update: {
          caregiver_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_students_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          benchmark_wpm: number
          created_at: string | null
          grade: string
          id: string
          name: string
          school_year: string
          teacher_id: string
        }
        Insert: {
          benchmark_wpm?: number
          created_at?: string | null
          grade: string
          id?: string
          name: string
          school_year?: string
          teacher_id: string
        }
        Update: {
          benchmark_wpm?: number
          created_at?: string | null
          grade?: string
          id?: string
          name?: string
          school_year?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_students: {
        Row: {
          cluster_id: string
          student_id: string
        }
        Insert: {
          cluster_id: string
          student_id: string
        }
        Update: {
          cluster_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_students_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "intervention_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_clusters: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          error_pattern: string
          id: string
          severity: string
          suggested_activity: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          error_pattern: string
          id?: string
          severity: string
          suggested_activity?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          error_pattern?: string
          id?: string
          severity?: string
          suggested_activity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_clusters_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      passages: {
        Row: {
          content: string
          created_at: string | null
          grade_level: string | null
          id: string
          title: string
          word_count: number
        }
        Insert: {
          content: string
          created_at?: string | null
          grade_level?: string | null
          id?: string
          title: string
          word_count: number
        }
        Update: {
          content?: string
          created_at?: string | null
          grade_level?: string | null
          id?: string
          title?: string
          word_count?: number
        }
        Relationships: []
      }
      phoneme_details: {
        Row: {
          expected: string
          id: string
          phoneme: string
          quality: number
          word_assessment_id: string
        }
        Insert: {
          expected: string
          id?: string
          phoneme: string
          quality: number
          word_assessment_id: string
        }
        Update: {
          expected?: string
          id?: string
          phoneme?: string
          quality?: number
          word_assessment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phoneme_details_word_assessment_id_fkey"
            columns: ["word_assessment_id"]
            isOneToOne: false
            referencedRelation: "word_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar: string | null
          class_id: string
          created_at: string | null
          goal_date: string | null
          goal_wpm: number | null
          grade: string
          id: string
          name: string
        }
        Insert: {
          avatar?: string | null
          class_id: string
          created_at?: string | null
          goal_date?: string | null
          goal_wpm?: number | null
          grade: string
          id?: string
          name: string
        }
        Update: {
          avatar?: string | null
          class_id?: string
          created_at?: string | null
          goal_date?: string | null
          goal_wpm?: number | null
          grade?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          school: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          school?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          school?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vouch_log: {
        Row: {
          created_at: string | null
          id: string
          original_error_type: string
          reason: string | null
          teacher_id: string
          word_assessment_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_error_type: string
          reason?: string | null
          teacher_id: string
          word_assessment_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          original_error_type?: string
          reason?: string | null
          teacher_id?: string
          word_assessment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouch_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_log_word_assessment_id_fkey"
            columns: ["word_assessment_id"]
            isOneToOne: false
            referencedRelation: "word_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      word_assessments: {
        Row: {
          assessment_id: string
          confidence: number | null
          detected_word: string | null
          duration_ms: number | null
          error_type: string
          id: string
          offset_ms: number | null
          vouched: boolean | null
          vouched_at: string | null
          vouched_by: string | null
          word: string
          word_index: number
        }
        Insert: {
          assessment_id: string
          confidence?: number | null
          detected_word?: string | null
          duration_ms?: number | null
          error_type: string
          id?: string
          offset_ms?: number | null
          vouched?: boolean | null
          vouched_at?: string | null
          vouched_by?: string | null
          word: string
          word_index: number
        }
        Update: {
          assessment_id?: string
          confidence?: number | null
          detected_word?: string | null
          duration_ms?: number | null
          error_type?: string
          id?: string
          offset_ms?: number | null
          vouched?: boolean | null
          vouched_at?: string | null
          vouched_by?: string | null
          word?: string
          word_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "word_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_assessments_vouched_by_fkey"
            columns: ["vouched_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_caregiver_student_ids: { Args: never; Returns: string[] }
      get_teacher_class_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "teacher" | "caregiver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["teacher", "caregiver"],
    },
  },
} as const
