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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      mock_tests: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          exam_type: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          subjects: string[] | null
          total_questions: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          exam_type?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          subjects?: string[] | null
          total_questions?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          exam_type?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          subjects?: string[] | null
          total_questions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          apply_link: string | null
          category: string | null
          content: string | null
          created_at: string
          exam_type: string | null
          id: string
          is_important: boolean
          is_new: boolean
          published_date: string
          summary: string | null
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          apply_link?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          exam_type?: string | null
          id?: string
          is_important?: boolean
          is_new?: boolean
          published_date?: string
          summary?: string | null
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          apply_link?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          exam_type?: string | null
          id?: string
          is_important?: boolean
          is_new?: boolean
          published_date?: string
          summary?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          marks: number
          mock_test_id: string
          options: Json
          order_index: number
          question: string
          subject: string | null
        }
        Insert: {
          correct_answer: number
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          mock_test_id: string
          options: Json
          order_index?: number
          question: string
          subject?: string | null
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          mock_test_id?: string
          options?: Json
          order_index?: number
          question?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_mock_test_id_fkey"
            columns: ["mock_test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_notifications: {
        Row: {
          apply_link: string | null
          created_at: string
          description: string | null
          exam_type: string | null
          id: string
          important_dates: Json | null
          is_active: boolean
          last_date: string | null
          official_link: string | null
          organization: string | null
          posted_at: string
          title: string
          updated_at: string
        }
        Insert: {
          apply_link?: string | null
          created_at?: string
          description?: string | null
          exam_type?: string | null
          id?: string
          important_dates?: Json | null
          is_active?: boolean
          last_date?: string | null
          official_link?: string | null
          organization?: string | null
          posted_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          apply_link?: string | null
          created_at?: string
          description?: string | null
          exam_type?: string | null
          id?: string
          important_dates?: Json | null
          is_active?: boolean
          last_date?: string | null
          official_link?: string | null
          organization?: string | null
          posted_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          exam_type: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_premium: boolean
          order_index: number
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_premium?: boolean
          order_index?: number
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_premium?: boolean
          order_index?: number
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          answers: Json | null
          completed_at: string
          created_at: string
          id: string
          mock_test_id: string
          score: number | null
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          mock_test_id: string
          score?: number | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          mock_test_id?: string
          score?: number | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_mock_test_id_fkey"
            columns: ["mock_test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          exam_type: string | null
          id: string
          is_admin: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exam_type?: string | null
          id: string
          is_admin?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exam_type?: string | null
          id?: string
          is_admin?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
